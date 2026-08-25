import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useJsonDocument } from '@/hooks/use-json-document'
import { useTranslation } from '@/i18n'
import { EDITOR_SIZE_LIMIT_BYTES } from '@/lib/big-file'
import { formatJson, minifyJson, type IndentOption } from '@/lib/format-json'
import { computeJsonStats } from '@/lib/json-stats'
import { sortJsonKeysDeep } from '@/lib/sort-json-keys'
import { validateJson } from '@/lib/validate-json'

const VALIDATION_DEBOUNCE_MS = 300

/**
 * All the non-visual behavior behind a JSON text input: validation, the big-file cutover,
 * drag&drop/paste/choose-file loading, and the format/minify/sort/copy/clear actions. Shared by
 * `JsonInput` (the CodeMirror-toolbar-validity-bar layout used by Compare) and any tool that
 * needs the same behavior with different chrome around it (Format's split input/result layout),
 * so the validate/big-file/action logic exists in exactly one place.
 */
export function useJsonInputState({
  value,
  onChange,
  softMode,
  formatIndent = '2',
}: {
  value: string
  onChange: (value: string) => void
  softMode: boolean
  formatIndent?: IndentOption
}) {
  const { t, locale } = useTranslation()
  const bigDoc = useJsonDocument()
  const [bigActive, setBigActive] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const debouncedValue = useDebouncedValue(value, VALIDATION_DEBOUNCE_MS)
  const validation = useMemo(
    () => validateJson(debouncedValue, softMode, locale),
    [debouncedValue, softMode, locale],
  )
  const stats = useMemo(
    () => (validation.valid && validation.value !== undefined ? computeJsonStats(validation.value) : null),
    [validation],
  )

  async function loadFile(file: File) {
    if (file.size > EDITOR_SIZE_LIMIT_BYTES) {
      setBigActive(true)
      await bigDoc.loadFile(file)
    } else {
      setBigActive(false)
      onChange(await file.text())
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (!text) {
        toast.message(t('jsonInput.clipboardEmpty'))
        return
      }
      if (new Blob([text]).size > EDITOR_SIZE_LIMIT_BYTES) {
        setBigActive(true)
        await bigDoc.loadText(text)
      } else {
        setBigActive(false)
        onChange(text)
      }
    } catch {
      toast.error(t('jsonInput.pasteError'))
    }
  }

  function chooseFile() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.txt,application/json,text/plain'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) void loadFile(file)
    }
    input.click()
  }

  function currentParsedOrToast(): ReturnType<typeof validateJson> | undefined {
    const result = validateJson(value, softMode, locale)
    if (!result.valid || result.value === undefined) {
      toast.error(t('jsonInput.formatError'))
      return undefined
    }
    return result
  }

  function handleFormat() {
    const result = currentParsedOrToast()
    if (result) onChange(formatJson(result.value, formatIndent))
  }

  function handleMinify() {
    const result = currentParsedOrToast()
    if (result) onChange(minifyJson(result.value))
  }

  function handleSortKeys() {
    const result = currentParsedOrToast()
    if (result) onChange(formatJson(sortJsonKeysDeep(result.value!), '2'))
  }

  function handleCopy() {
    void navigator.clipboard.writeText(value).then(() => toast.success(t('jsonInput.copied')))
  }

  function handleClear() {
    onChange('')
    setBigActive(false)
    bigDoc.reset()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const mod = e.metaKey || e.ctrlKey
    if (!mod) return
    if (e.key === 'Enter' || (e.shiftKey && e.key.toLowerCase() === 'f')) {
      e.preventDefault()
      handleFormat()
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void loadFile(file)
  }

  return {
    t,
    locale,
    bigDoc,
    bigActive,
    setBigActive,
    dragOver,
    setDragOver,
    debouncedValue,
    validation,
    stats,
    loadFile,
    pasteFromClipboard,
    chooseFile,
    handleFormat,
    handleMinify,
    handleSortKeys,
    handleCopy,
    handleClear,
    handleKeyDown,
    handleDrop,
  }
}
