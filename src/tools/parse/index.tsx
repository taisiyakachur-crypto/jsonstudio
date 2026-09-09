import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useTranslation } from '@/i18n'
import { formatJson } from '@/lib/format-json'
import { beautifyLoose } from '@/lib/beautify-loose'
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
    if (debouncedInput.trim() === '') return { value: null, error: null, beautified: null }
    try {
      const value = parseByFormat(debouncedInput, tab.state.sourceFormat, {
        csvDelimiter: tab.state.csvDelimiter,
        csvCoerceTypes: tab.state.csvCoerceTypes,
      })
      return { value, error: null, beautified: null }
    } catch (err) {
      // JSON5 is the one format that's "supposed" to be JSON -- rather than guess at fixing it
      // (which risks silently changing what's actually there), just reflow the whitespace/indent
      // of exactly what was typed and show that, missing brackets and all. Other formats (YAML,
      // CSV, ...) have their own syntax and don't get a JSON-shaped fallback.
      const resolved = tab.state.sourceFormat === 'auto' ? detectedFormat : tab.state.sourceFormat
      if (resolved === 'json5') {
        return { value: null, error: null, beautified: beautifyLoose(debouncedInput) }
      }
      const message = err instanceof ParseInputError ? err.message : (err as Error).message
      return { value: null, error: message, beautified: null }
    }
  }, [debouncedInput, tab.state.sourceFormat, tab.state.csvDelimiter, tab.state.csvCoerceTypes, detectedFormat])

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
    // With a real parsed value, send it fully formatted. Otherwise (JSON5 that only got a loose
    // beautify, still possibly invalid) only "→ Format" makes sense -- send the beautified text
    // as-is and let Format's own repair take it from there.
    let text: string
    if (parseResult.value !== null) {
      text = formatJson(parseResult.value, '2')
    } else if (parseResult.beautified !== null && type === 'format') {
      text = parseResult.beautified
    } else {
      return
    }
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
        beautified={parseResult.beautified}
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
