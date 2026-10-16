// Web has no secure enclave. This in-memory store exists only so the UI can be
// previewed in a browser; nothing (including passwords) is persisted.
const memory = new Map<string, string>();

export async function getItemAsync(key: string): Promise<string | null> {
  return memory.get(key) ?? null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  memory.set(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  memory.delete(key);
}
