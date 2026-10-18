import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import type { SslConfig } from "../types";

export interface TlsOptions {
  enabled: boolean;
  rejectUnauthorized?: boolean;
  ca?: string;
  cert?: string;
  key?: string;
}

export interface TcpConnectionOptions {
  host: string;
  port: number;
  tls?: boolean | TlsOptions;
  timeout?: number;
}

export const sslConfigToTlsOptions = (ssl: boolean | SslConfig): boolean | TlsOptions => {
  if (typeof ssl === "boolean") {
    return ssl;
  }
  return {
    enabled: ssl.enabled,
    rejectUnauthorized: ssl.rejectUnauthorized,
    ca: ssl.ca,
    cert: ssl.cert,
    key: ssl.key,
  };
};

type TcpSocketInstance = {
  write: (data: Buffer, encoding?: string, cb?: (err?: Error) => void) => void;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  destroy: () => void;
};

type TcpSocketModule = {
  createConnection: (options: Record<string, unknown>, cb?: () => void) => TcpSocketInstance;
  connectTLS?: (options: Record<string, unknown>, cb?: () => void) => TcpSocketInstance;
  TLSSocket?: new (
    socket: TcpSocketInstance,
    options?: Record<string, unknown>,
  ) => TcpSocketInstance;
};

export const isTlsEnabled = (tls: boolean | TlsOptions | undefined): boolean =>
  typeof tls === "boolean" ? tls : (tls?.enabled ?? false);

const tlsSocketOptions = (tls: boolean | TlsOptions): Record<string, unknown> => {
  const options: Record<string, unknown> = {};
  if (typeof tls === "object") {
    if (tls.rejectUnauthorized !== undefined) options.rejectUnauthorized = tls.rejectUnauthorized;
    if (tls.ca) options.ca = tls.ca;
    if (tls.cert) options.cert = tls.cert;
    if (tls.key) options.key = tls.key;
  }
  return options;
};

let cachedTcpSocket: TcpSocketModule | null = null;
let tcpSocketLoadError: Error | null = null;

function getTcpSocket(): TcpSocketModule {
  if (cachedTcpSocket) return cachedTcpSocket;
  if (tcpSocketLoadError) throw tcpSocketLoadError;

  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    const message =
      "TCP sockets are not available in Expo Go. Create a development build to use database connections.";
    tcpSocketLoadError = new Error(message);
    throw tcpSocketLoadError;
  }

  if (Platform.OS === "web") {
    tcpSocketLoadError = new Error(
      "Database connections need the iOS or Android app. The web preview can’t open TCP sockets.",
    );
    throw tcpSocketLoadError;
  }

  try {
    const mod = require("react-native-tcp-socket");
    const candidate = (mod?.default ?? mod) as Partial<TcpSocketModule> | undefined;
    if (typeof candidate?.createConnection !== "function") {
      throw new Error("react-native-tcp-socket did not load");
    }
    cachedTcpSocket = candidate as TcpSocketModule;
    return cachedTcpSocket;
  } catch {
    const message =
      "TCP sockets are not available in this build. Create a development build to use database connections.";
    tcpSocketLoadError = new Error(message);
    throw tcpSocketLoadError;
  }
}

/**
 * O(1) append buffer list - avoids O(N²) Buffer.concat on every data event.
 * Concatenates only when data is consumed via read().
 */
class BufferList {
  private chunks: Buffer[] = [];
  private totalLength = 0;

  push(chunk: Buffer): void {
    this.chunks.push(chunk);
    this.totalLength += chunk.length;
  }

  get length(): number {
    return this.totalLength;
  }

  read(n?: number): Buffer {
    if (this.totalLength === 0) {
      return Buffer.alloc(0);
    }

    if (n === undefined || n >= this.totalLength) {
      const result =
        this.chunks.length === 1 ? this.chunks[0] : Buffer.concat(this.chunks, this.totalLength);
      this.chunks = [];
      this.totalLength = 0;
      return result;
    }

    const result = Buffer.allocUnsafe(n);
    let offset = 0;
    let remaining = n;

    while (remaining > 0 && this.chunks.length > 0) {
      const chunk = this.chunks[0];

      if (chunk.length <= remaining) {
        chunk.copy(result, offset);
        offset += chunk.length;
        remaining -= chunk.length;
        this.chunks.shift();
      } else {
        chunk.copy(result, offset, 0, remaining);
        this.chunks[0] = chunk.slice(remaining);
        remaining = 0;
      }
    }

    this.totalLength -= n;
    return result;
  }

  clear(): void {
    this.chunks = [];
    this.totalLength = 0;
  }
}

export class TcpClient {
  private socket: TcpSocketInstance | null = null;
  private tlsSocket: TcpSocketInstance | null = null;
  private pendingSends = new Set<(error: Error) => void>();
  private buffer = new BufferList();
  private messageQueue: Array<{
    resolve: (data: Buffer) => void;
    reject: (error: Error) => void;
  }> = [];
  private connected = false;

  async connect(options: TcpConnectionOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const { host, port, tls = false, timeout = 10000 } = options;

      let TcpSocket: TcpSocketModule;
      try {
        TcpSocket = getTcpSocket();
      } catch (error) {
        reject(error instanceof Error ? error : new Error("TCP socket unavailable"));
        return;
      }

      const useTls = isTlsEnabled(tls);

      const connectionOptions: Record<string, unknown> = {
        host,
        port,
        timeout,
        ...(useTls ? tlsSocketOptions(tls) : {}),
      };

      const socket = useTls
        ? TcpSocket.connectTLS?.(connectionOptions, () => {
            this.connected = true;
            resolve();
          })
        : TcpSocket.createConnection(connectionOptions, () => {
            this.connected = true;
            resolve();
          });

      if (!socket) {
        reject(new Error("TLS connections are not supported on this build"));
        return;
      }

      this.socket = socket;

      socket.on("data", (data: unknown) => {
        let buf: Buffer;
        if (Buffer.isBuffer(data)) {
          buf = data;
        } else if (data instanceof Uint8Array) {
          buf = Buffer.from(data);
        } else if (typeof data === "string") {
          buf = Buffer.from(data);
        } else {
          buf = Buffer.from(data as number[]);
        }
        this.buffer.push(buf);
        this.processBuffer();
      });

      socket.on("error", (error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        if (!this.connected) {
          reject(err);
        }
        this.handleError(err);
      });

      socket.on("close", () => {
        this.connected = false;
        this.rejectPendingMessages(new Error("Connection closed"));
      });

      socket.on("timeout", () => {
        reject(new Error("Connection timeout"));
        this.disconnect();
      });
    });
  }

  /**
   * Upgrade the open plaintext connection to TLS in place (STARTTLS style), for
   * protocols that negotiate TLS inside their own handshake: PostgreSQL
   * SSLRequest, MySQL CLIENT_SSL. Writes issued after this call are encrypted;
   * the native layer holds them until the TLS handshake completes. Existing
   * data/close listeners keep working because both objects share one native socket.
   */
  upgradeToTls(tls: boolean | TlsOptions): void {
    if (!this.socket || !this.connected) {
      throw new Error("Not connected");
    }
    if (this.buffer.length > 0) {
      // Plaintext bytes arriving before the upgrade could be injected by an attacker.
      throw new Error("Unexpected data from server before TLS upgrade");
    }
    const { TLSSocket } = getTcpSocket();
    if (!TLSSocket) {
      throw new Error("TLS connections are not supported on this build");
    }
    this.tlsSocket = new TLSSocket(this.socket, tlsSocketOptions(tls));
  }

  async send(data: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        reject(new Error("Not connected"));
        return;
      }

      // A write whose socket errors or closes (e.g. a failed TLS handshake)
      // never gets its callback; settle it from the error/close path instead.
      const fail = (error: Error) => reject(error);
      this.pendingSends.add(fail);
      this.socket.write(data, undefined, (err: Error | undefined) => {
        this.pendingSends.delete(fail);
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async receive(expectedLength?: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      if (expectedLength && this.buffer.length >= expectedLength) {
        resolve(this.buffer.read(expectedLength));
        return;
      }
      if (!expectedLength && this.buffer.length > 0) {
        resolve(this.buffer.read());
        return;
      }

      this.messageQueue.push({ resolve, reject });
    });
  }

  private processBuffer(): void {
    while (this.messageQueue.length > 0 && this.buffer.length > 0) {
      const pending = this.messageQueue.shift();
      if (pending) {
        pending.resolve(this.buffer.read());
      }
    }
  }

  private handleError(error: Error): void {
    this.rejectPendingMessages(error);
  }

  private rejectPendingMessages(error: Error): void {
    while (this.messageQueue.length > 0) {
      const pending = this.messageQueue.shift();
      pending?.reject(error);
    }
    for (const fail of this.pendingSends) fail(error);
    this.pendingSends.clear();
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      // Both objects wrap one native socket; destroy it once.
      (this.tlsSocket ?? this.socket).destroy();
      this.tlsSocket = null;
      this.socket = null;
      this.connected = false;
      this.buffer.clear();
      this.rejectPendingMessages(new Error("Connection closed"));
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
