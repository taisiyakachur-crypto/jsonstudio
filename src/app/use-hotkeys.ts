import { useEffect } from 'react'
import { useTabsStore } from '@/store/tabs-store'

interface HotkeyHandlers {
  onOpenCommandPalette: () => void
}

/** Global keyboard shortcuts: Ctrl/Cmd+T (new tab), Ctrl/Cmd+W (close tab), Ctrl/Cmd+K (command
 *  palette), Ctrl/Cmd+1..9 (switch to the Nth open tab -- matches the shortcuts shown next to
 *  each tab in the command palette's "Перейти до" group). */
export function useGlobalHotkeys({ onOpenCommandPalette }: HotkeyHandlers): void {
  const addTab = useTabsStore((s) => s.addTab)
  const closeTab = useTabsStore((s) => s.closeTab)
  const activeTabId = useTabsStore((s) => s.activeTabId)
  const setActiveTab = useTabsStore((s) => s.setActiveTab)
  const tabs = useTabsStore((s) => s.tabs)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return

      if (e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenCommandPalette()
        return
      }
      if (e.key.toLowerCase() === 't') {
        e.preventDefault()
        addTab('format')
        return
      }
      if (e.key.toLowerCase() === 'w') {
        e.preventDefault()
        if (activeTabId) closeTab(activeTabId)
        return
      }
      if (/^[1-9]$/.test(e.key)) {
        const target = tabs[Number(e.key) - 1]
        if (target) {
          e.preventDefault()
          setActiveTab(target.id)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [addTab, closeTab, activeTabId, onOpenCommandPalette, setActiveTab, tabs])
}
