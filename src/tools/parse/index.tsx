import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useTranslation } from '@/i18n'
import { formatJson } from '@/lib/format-json'
import { detectFormat, ParseInputError, parseByFormat, type SourceFormat } from '@/lib/parsers'
import { TOOL_TITLES } from '@/lib/tab-defaults'
import { useTabsStore } from '@/store/tabs-store'
import type { Tab } from '@/types/tabs'
import { PARSE_EXAMPLES } from './example'
import { ParseFormatCard } from './parse-format-card'
import { ParseOutput } from './parse-output'
import { RawTextInput } from './raw-text-input'

const PARSE_DEBOUNCE_MS = 300

type SendableTool = 'compare' | 'table' | 'chart' | 'format'

export function ParsePane({ tab }: { tab: Tab<'parse'> }) {
  const { t, locale } = useTranslation()
  const updateTabState = useTabsStore((s) => s.updateTabState)
  const addTab = useTabsStore((s) => s.addTab)
  const [minified, setMinified] = useState(false)

  const debouncedInput = useDebouncedValue(tab.state.input, PARSE_DEBOUNCE_MS)
  const detectedFormat = useMemo(() => detectFormat(debouncedInput), [debouncedInput])

  const parseResult = useMemo(() => {
    if (debouncedInput.trim() === '') return { value: null, error: null }
    try {
      const value = parseByFormat(debouncedInput, tab.state.sourceFormat, {
        csvDelimiter: tab.state.csvDelimiter,
        csvCoerceTypes: tab.state.csvCoerceTypes,
      })
      return { value, error: null }
    } catch (err) {
      const message = err instanceof ParseInputError ? err.message : (err as Error).message
      return { value: null, error: message }
    }
  }, [debouncedInput, tab.state.sourceFormat, tab.state.csvDelimiter, tab.state.csvCoerceTypes])

  const effectiveFormat = tab.state.sourceFormat === 'auto' ? detectedFormat : tab.state.sourceFormat
  const columnCount =
    effectiveFormat === 'csv' &&
    Array.isArray(parseResult.value) &&
    parseResult.value.length > 0 &&
    typeof parseResult.value[0] === 'object' &&
    parseResult.value[0] !== null &&
    !Array.isArray(parseResult.value[0])
      ? Object.keys(parseResult.value[0]).length
      : undefined

  function setInput(input: string) {
    updateTabState<'parse'>(tab.id, (s) => ({ ...s, input }))
  }
  function setSourceFormat(sourceFormat: SourceFormat) {
    updateTabState<'parse'>(tab.id, (s) => ({ ...s, sourceFormat }))
  }
  function setCsvDelimiter(csvDelimiter: string) {
    updateTabState<'parse'>(tab.id, (s) => ({ ...s, csvDelimiter }))
  }
  function setCsvCoerceTypes(csvCoerceTypes: boolean) {
    updateTabState<'parse'>(tab.id, (s) => ({ ...s, csvCoerceTypes }))
  }

  function loadExample() {
    const example = PARSE_EXAMPLES[tab.state.sourceFormat] ?? PARSE_EXAMPLES.auto!
    setInput(example)
  }

  function sendTo(type: SendableTool) {
    if (parseResult.value === null) return
    const text = formatJson(parseResult.value, '2')
    const newId = addTab(type)
    switch (type) {
      case 'compare':
        updateTabState<'compare'>(newId, (s) => ({
          ...s,
          panels: s.panels.map((p, i) => (i === 0 ? { ...p, text } : p)),
        }))
        break
      case 'table':
        updateTabState<'table'>(newId, (s) => ({ ...s, input: text }))
        break
      case 'chart':
        updateTabState<'chart'>(newId, (s) => ({ ...s, input: text }))
        break
      case 'format':
        updateTabState<'format'>(newId, (s) => ({ ...s, input: text }))
        break
    }
    toast.success(t('parse.sentToast', { title: TOOL_TITLES[type][locale] }))
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex w-[420px] shrink-0 flex-col gap-3 overflow-hidden border-r border-border p-3.5">
        <ParseFormatCard
          sourceFormat={tab.state.sourceFormat}
          detectedFormat={detectedFormat}
          onSourceFormatChange={setSourceFormat}
          csvDelimiter={tab.state.csvDelimiter}
          onCsvDelimiterChange={setCsvDelimiter}
          columnCount={columnCount}
        />
        <RawTextInput value={tab.state.input} onChange={setInput} onLoadExample={loadExample} />
      </div>
      <ParseOutput
        value={parseResult.value}
        error={parseResult.error}
        minified={minified}
        onMinifiedChange={setMinified}
        onSendTo={sendTo}
        showCoerceTypes={effectiveFormat === 'csv'}
        coerceTypes={tab.state.csvCoerceTypes}
        onCoerceTypesChange={setCsvCoerceTypes}
      />
    </div>
  )
}
