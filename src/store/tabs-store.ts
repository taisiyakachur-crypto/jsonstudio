import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { defaultStateFor, TOOL_TITLES } from '@/lib/tab-defaults'
import {
  approximateByteSize,
  CONTENT_PERSIST_LIMIT_BYTES,
  deleteTabContent,
  loadTabContent,
  saveTabContent,
} from '@/lib/tab-storage'
import type { AnyTab, Tab, ToolState, ToolType } from '@/types/tabs'

interface TabMeta {
  id: string
  type: ToolType
  title: string
  createdAt: number
  updatedAt: number
  contentTruncatedFromPersist?: boolean
}

interface TabsState {
  /** Full tabs, state included, kept in memory for the running session. */
  tabs: AnyTab[]
  activeTabId: string | null
  hydrated: boolean

  hydrateContentFromIndexedDb: () => Promise<void>
  addTab: <T extends ToolType>(type: T, opts?: { activate?: boolean }) => string
  duplicateTab: (id: string) => string | undefined
  closeTab: (id: string) => void
  renameTab: (id: string, title: string) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
  setActiveTab: (id: string) => void
  updateTabState: <T extends ToolType>(id: string, updater: (state: ToolState[T]) => ToolState[T]) => void
  forceSaveTabContent: (id: string) => Promise<void>
}

function persistTabState(tab: AnyTab): void {
  const size = approximateByteSize(tab.state)
  if (size > CONTENT_PERSIST_LIMIT_BYTES) {
    return
  }
  void saveTabContent(tab.id, tab.state)
}

export const useTabsStore = create<TabsState>()(
  persist(
    (setState, getState) => ({
      tabs: [],
      activeTabId: null,
      hydrated: false,

      hydrateContentFromIndexedDb: async () => {
        const { tabs } = getState()
        const loaded = await Promise.all(
          tabs.map(async (tab) => {
            const content = await loadTabContent<AnyTab['state']>(tab.id)
            return content ? ({ ...tab, state: content } as AnyTab) : tab
          }),
        )
        setState({ tabs: loaded, hydrated: true })
      },

      addTab: <T extends ToolType>(type: T, opts?: { activate?: boolean }) => {
        const id = crypto.randomUUID()
        const now = Date.now()
        const tab: Tab<T> = {
          id,
          type,
          title: TOOL_TITLES[type].uk,
          state: defaultStateFor(type),
          createdAt: now,
          updatedAt: now,
        }
        setState((s) => ({
          tabs: [...s.tabs, tab as AnyTab],
          activeTabId: opts?.activate === false ? s.activeTabId : id,
        }))
        persistTabState(tab as AnyTab)
        return id
      },

      duplicateTab: (id) => {
        const source = getState().tabs.find((t) => t.id === id)
        if (!source) return undefined
        const newId = crypto.randomUUID()
        const now = Date.now()
        const clone: AnyTab = {
          ...source,
          id: newId,
          title: `${source.title} (2)`,
          createdAt: now,
          updatedAt: now,
        }
        setState((s) => ({ tabs: [...s.tabs, clone], activeTabId: newId }))
        persistTabState(clone)
        return newId
      },

      closeTab: (id) => {
        void deleteTabContent(id)
        setState((s) => {
          const idx = s.tabs.findIndex((t) => t.id === id)
          const tabs = s.tabs.filter((t) => t.id !== id)
          let activeTabId = s.activeTabId
          if (activeTabId === id) {
            const fallback = tabs[Math.min(idx, tabs.length - 1)]
            activeTabId = fallback ? fallback.id : null
          }
          return { tabs, activeTabId }
        })
      },

      renameTab: (id, title) => {
        setState((s) => ({
          tabs: s.tabs.map((t) => (t.id === id ? { ...t, title, updatedAt: Date.now() } : t)),
        }))
      },

      reorderTabs: (fromIndex, toIndex) => {
        setState((s) => {
          const tabs = [...s.tabs]
          const [moved] = tabs.splice(fromIndex, 1)
          if (!moved) return s
          tabs.splice(toIndex, 0, moved)
          return { tabs }
        })
      },

      setActiveTab: (id) => setState({ activeTabId: id }),

      updateTabState: <T extends ToolType>(id: string, updater: (state: ToolState[T]) => ToolState[T]) => {
        let updatedTab: AnyTab | undefined
        setState((s) => ({
          tabs: s.tabs.map((t) => {
            if (t.id !== id) return t
            // The type param T is supplied by the caller (e.g. updateTabState<'format'>(...))
            // and isn't checked against this tab's actual type at runtime here.
            const next = {
              ...t,
              state: updater(t.state as ToolState[T]),
              updatedAt: Date.now(),
            } as AnyTab
            updatedTab = next
            return next
          }),
        }))
        if (updatedTab) {
          const size = approximateByteSize(updatedTab.state)
          const truncated = size > CONTENT_PERSIST_LIMIT_BYTES
          if (truncated !== updatedTab.contentTruncatedFromPersist) {
            setState((s) => ({
              tabs: s.tabs.map((t) =>
                t.id === id ? { ...t, contentTruncatedFromPersist: truncated } : t,
              ),
            }))
          }
          if (!truncated) {
            persistTabState(updatedTab)
          }
        }
      },

      forceSaveTabContent: async (id) => {
        const tab = getState().tabs.find((t) => t.id === id)
        if (!tab) return
        await saveTabContent(id, tab.state)
        setState((s) => ({
          tabs: s.tabs.map((t) => (t.id === id ? { ...t, contentTruncatedFromPersist: false } : t)),
        }))
      },
    }),
    {
      name: 'json-studio-tabs-meta',
      storage: createJSONStorage(() => localStorage),
      // Only metadata goes to localStorage; the (possibly large) `state` field is
      // stripped here and re-attached from IndexedDB by hydrateContentFromIndexedDb.
      partialize: (s) => ({
        activeTabId: s.activeTabId,
        tabs: s.tabs.map(
          (t): TabMeta & { state: null } => ({
            id: t.id,
            type: t.type,
            title: t.title,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            contentTruncatedFromPersist: t.contentTruncatedFromPersist,
            state: null,
          }),
        ),
      }),
      merge: (persisted, current) => {
        const p = persisted as { activeTabId: string | null; tabs: (TabMeta & { state: null })[] } | undefined
        if (!p) return current
        return {
          ...current,
          activeTabId: p.activeTabId,
          tabs: p.tabs.map((meta) => ({
            ...meta,
            state: defaultStateFor(meta.type),
          })) as AnyTab[],
        }
      },
      onRehydrateStorage: () => (state) => {
        void state?.hydrateContentFromIndexedDb()
      },
    },
  ),
)
