import { useState } from 'react'
import { JsonInput } from '@/components/json-input'
import { useTabsStore } from '@/store/tabs-store'
import type { JsonStats } from '@/lib/json-stats'
import type { Tab } from '@/types/tabs'
import { FORMAT_EXAMPLE_JSON } from './example'
import { FormatSidebar } from './format-sidebar'

export function FormatPane({ tab }: { tab: Tab<'format'> }) {
  const updateTabState = useTabsStore((s) => s.updateTabState)
  const [mode, setMode] = useState<'small' | 'big'>('small')
  const [stats, setStats] = useState<JsonStats | null>(null)

  function setInput(input: string) {
    updateTabState<'format'>(tab.id, (s) => ({ ...s, input }))
  }
  function setSoftMode(softMode: boolean) {
    updateTabState<'format'>(tab.id, (s) => ({ ...s, softMode }))
  }
  function setIndent(indent: Tab<'format'>['state']['indent']) {
    updateTabState<'format'>(tab.id, (s) => ({ ...s, indent }))
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <JsonInput
        value={tab.state.input}
        onChange={setInput}
        softMode={tab.state.softMode}
        onSoftModeChange={setSoftMode}
        formatIndent={tab.state.indent}
        onModeChange={setMode}
        onStatsChange={setStats}
        onLoadExample={() => setInput(FORMAT_EXAMPLE_JSON)}
        className="min-w-0"
      />
      {mode === 'small' && (
        <FormatSidebar indent={tab.state.indent} onIndentChange={setIndent} stats={stats} />
      )}
    </div>
  )
}
