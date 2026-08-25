import { createStore, del, get, set } from 'idb-keyval'

/**
 * Tab metadata (id, type, title, timestamps) lives in localStorage via zustand/persist —
 * it's small and needs to be synchronous on load. The (potentially large) `state` payload
 * for each tab lives here, in IndexedDB, keyed by tab id.
 */
const tabContentStore = createStore('json-studio-tabs', 'content')

export const CONTENT_PERSIST_LIMIT_BYTES = 5 * 1024 * 1024 // 5 MB

export function approximateByteSize(value: unknown): number {
  try {
    return new Blob([JSON.stringify(value)]).size
  } catch {
    return Infinity
  }
}

export async function saveTabContent(tabId: string, state: unknown): Promise<void> {
  await set(tabId, state, tabContentStore)
}

export async function loadTabContent<T>(tabId: string): Promise<T | undefined> {
  return get<T>(tabId, tabContentStore)
}

export async function deleteTabContent(tabId: string): Promise<void> {
  await del(tabId, tabContentStore)
}
