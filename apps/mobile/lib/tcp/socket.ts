import Constants, { ExecutionEnvironment } from "expo-constants";
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
  write: (
    data: Buffer,
    encoding?: string,
    cb?: (err?: Error) => void
  ) => void;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  destroy: () => void;
};

type TcpSocketModule = {
  createConnection: (options: Record<string, unknown>, cb?: () => void) => TcpSocketInstance;
  connectTLS?: (options: Record<string, unknown>, cb?: () => void) => TcpSocketInstance;
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

  try {
    const mod = require("react-native-tcp-socket");
    cachedTcpSocket = (mod?.default ?? mod) as TcpSocketModule;
    return cachedTcpSocket;
  } catch {
    const message =
      "TCP sockets are not available in Expo Go. Create a development build to use database connections.";
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
      const result = this.chunks.length === 1 
        ? this.chunks[0] 
        : Buffer.concat(this.chunks, this.totalLength);
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

      const useTls = typeof tls === "boolean" ? tls : tls.enabled;

      const connectionOptions: Record<string, unknown> = {
        host,
        port,
        timeout,
      };

      if (useTls && typeof tls === "object") {
        if (tls.rejectUnauthorized !== undefined) {
          connectionOptions.rejectUnauthorized = tls.rejectUnauthorized;
        }
        if (tls.ca) {
          connectionOptions.ca = tls.ca;
        }
        if (tls.cert) {
          connectionOptions.cert = tls.cert;
        }
        if (tls.key) {
          connectionOptions.key = tls.key;
        }
      }

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

  async send(data: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        reject(new Error("Not connected"));
        return;
      }

      this.socket.write(data, undefined, (err: Error | undefined) => {
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
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
      this.connected = false;
      this.buffer.clear();
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
