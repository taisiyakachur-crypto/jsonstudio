import { json } from '@codemirror/lang-json'
import { linter, lintGutter } from '@codemirror/lint'
import CodeMirror from '@uiw/react-codemirror'
import { useMemo } from 'react'
import { useResolvedTheme } from '@/hooks/use-resolved-theme'
import { validateJson } from '@/lib/validate-json'
import type { Locale } from '@/store/settings-store'

const LINT_DEBOUNCE_MS = 300

export function JsonEditor({
  value,
  onChange,
  softMode,
  locale,
  autoFocus,
  onKeyDownCapture,
  readOnly = false,
}: {
  value: string
  onChange?: (value: string) => void
  softMode: boolean
  locale: Locale
  autoFocus?: boolean
  onKeyDownCapture?: (e: React.KeyboardEvent) => void
  /** Renders the value without an edit affordance or a linter pass (it's already-valid output). */
  readOnly?: boolean
}) {
  const theme = useResolvedTheme()

  const extensions = useMemo(
    () => [
      json(),
      ...(readOnly
        ? []
        : [
            lintGutter(),
            linter(
              (view) => {
                const text = view.state.doc.toString()
                const result = validateJson(text, softMode, locale)
                if (result.valid || !result.error) return []
                const from = Math.max(0, Math.min(result.error.offset, text.length))
                const to = Math.max(from + 1, Math.min(from + result.error.length, text.length))
                return [{ from, to, severity: 'error' as const, message: result.error.message }]
              },
              { delay: LINT_DEBOUNCE_MS },
            ),
          ]),
    ],
    [softMode, locale, readOnly],
  )

  return (
    <div className="h-full [&_.cm-editor]:h-full" onKeyDownCapture={onKeyDownCapture}>
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={theme}
        height="100%"
        extensions={extensions}
        autoFocus={autoFocus}
        readOnly={readOnly}
        basicSetup={{ tabSize: 2 }}
        className="h-full text-sm"
      />
    </div>
  )
}
