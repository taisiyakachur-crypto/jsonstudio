import { useEffect, useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { useTabsStore } from '@/store/tabs-store'
import { applyThemeClass, useSettingsStore } from '@/store/settings-store'
import { CommandPalette } from './command-palette'
import { Footer } from './footer'
import { HeaderControls } from './header-controls'
import { EmptyTabsPlaceholder, TabBar } from './tab-bar'
import { TabContent } from './tab-content'
import { useGlobalHotkeys } from './use-hotkeys'

export function App() {
  const theme = useSettingsStore((s) => s.theme)
  const tabs = useTabsStore((s) => s.tabs)
  const activeTabId = useTabsStore((s) => s.activeTabId)
  const hydrated = useTabsStore((s) => s.hydrated)
  const addTab = useTabsStore((s) => s.addTab)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    applyThemeClass(theme)
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => applyThemeClass('system')
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [theme])

  useEffect(() => {
    if (hydrated && useTabsStore.getState().tabs.length === 0) {
      addTab('format')
    }
    // Only ever run once, right after IndexedDB hydration completes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  useGlobalHotkeys({ onOpenCommandPalette: () => setPaletteOpen(true) })

  const activeTab = tabs.find((t) => t.id === activeTabId)

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen flex-col bg-background text-foreground">
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3">
          <span className="text-sm font-semibold tracking-tight">JSON Studio</span>
          <HeaderControls />
        </header>
        <TabBar />
        <main className="flex flex-1 flex-col overflow-hidden">
          {activeTab ? <TabContent tab={activeTab} /> : <EmptyTabsPlaceholder />}
        </main>
        <Footer />
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <Toaster />
    </TooltipProvider>
  )
}
