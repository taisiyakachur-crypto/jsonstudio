import { useMemo } from 'react'
import { ExportBar } from '@/components/export-bar'
import { useTranslation } from '@/i18n'
import { generateTypeScript } from '@/lib/generate-typescript'
import type { JsonValue } from '@/types/json'

export function TypeScriptPanel({ value }: { value: JsonValue | null }) {
  const { t } = useTranslation()
  const generated = useMemo(() => (value === null ? '' : generateTypeScript(value)), [value])

  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-foreground">{t('format.typescript.title')}</p>
        <ExportBar
          formats={[
            {
              id: 'ts',
              label: t('format.typescript.export.ts'),
              filename: 'types.ts',
              mimeType: 'text/typescript;charset=utf-8',
              getContent: () => generated,
            },
          ]}
        />
      </div>
      <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-2 font-mono text-[11px]">
        {generated}
      </pre>
    </div>
  )
}
