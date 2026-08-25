import { useState } from 'react'
import { JsonInput } from '@/components/json-input'
import { useTabsStore } from '@/store/tabs-store'
import type { JsonStats } from '@/lib/json-stats'
import type { JsonValue } from '@/types/json'
import type { FormatSidebarTab, Tab } from '@/types/tabs'
import { FORMAT_EXAMPLE_JSON } from './example'
import { FormatSidebar } from './format-sidebar'

export function FormatPane({ tab }: { tab: Tab<'format'> }) {
  const updateTabState = useTabsStore((s) => s.updateTabState)
  const [mode, setMode] = useState<'small' | 'big'>('small')
  const [stats, setStats] = useState<JsonStats | null>(null)
  const [value, setValue] = useState<JsonValue | null>(null)

  function setInput(input: string) {
    updateTabState<'format'>(tab.id, (s) => ({ ...s, input }))
  }
  function setSoftMode(softMode: boolean) {
    updateTabState<'format'>(tab.id, (s) => ({ ...s, softMode }))
  }
  function setIndent(indent: Tab<'format'>['state']['indent']) {
    updateTabState<'format'>(tab.id, (s) => ({ ...s, indent }))
  }
  function setSidebarTab(sidebarTab: FormatSidebarTab) {
    updateTabState<'format'>(tab.id, (s) => ({ ...s, sidebarTab }))
  }
  function setJsonPathQuery(jsonPathQuery: string) {
    updateTabState<'format'>(tab.id, (s) => ({ ...s, jsonPathQuery }))
  }
  function setSchemaInput(schemaInput: string) {
    updateTabState<'format'>(tab.id, (s) => ({ ...s, schemaInput }))
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
        onValueChange={setValue}
        onLoadExample={() => setInput(FORMAT_EXAMPLE_JSON)}
        className="min-w-0"
      />
      {mode === 'small' && (
        <FormatSidebar
          indent={tab.state.indent}
          onIndentChange={setIndent}
          stats={stats}
          value={value}
          sidebarTab={tab.state.sidebarTab}
          onSidebarTabChange={setSidebarTab}
          jsonPathQuery={tab.state.jsonPathQuery}
          onJsonPathQueryChange={setJsonPathQuery}
          schemaInput={tab.state.schemaInput}
          onSchemaInputChange={setSchemaInput}
        />
      )}
    </div>
  )
}
