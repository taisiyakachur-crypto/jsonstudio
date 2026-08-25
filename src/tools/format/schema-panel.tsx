import { useMemo } from 'react'
import { ExportBar } from '@/components/export-bar'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/i18n'
import { generateJsonSchema } from '@/lib/generate-json-schema'
import { validateAgainstSchema } from '@/lib/validate-with-schema'
import type { JsonValue } from '@/types/json'

export function SchemaPanel({
  value,
  schemaInput,
  onSchemaInputChange,
}: {
  value: JsonValue | null
  schemaInput: string
  onSchemaInputChange: (schema: string) => void
}) {
  const { t } = useTranslation()
  const generated = useMemo(() => (value === null ? '' : JSON.stringify(generateJsonSchema(value), null, 2)), [value])
  const validation = useMemo(() => {
    if (value === null || schemaInput.trim() === '') return null
    return validateAgainstSchema(value, schemaInput)
  }, [value, schemaInput])

  return (
    <div className="flex flex-col gap-4 text-xs">
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="font-medium text-foreground">{t('format.schema.generatedTitle')}</p>
          <ExportBar
            formats={[
              {
                id: 'schema',
                label: t('format.schema.export.json'),
                filename: 'schema.json',
                mimeType: 'application/json;charset=utf-8',
                getContent: () => generated,
              },
            ]}
          />
        </div>
        <pre className="max-h-56 overflow-auto rounded-md border border-border bg-muted/30 p-2 font-mono text-[11px]">
          {generated}
        </pre>
      </div>
      <div>
        <p className="mb-1 font-medium text-foreground">{t('format.schema.validateTitle')}</p>
        <Textarea
          value={schemaInput}
          onChange={(e) => onSchemaInputChange(e.target.value)}
          placeholder={t('format.schema.validatePlaceholder')}
          className="h-24 font-mono text-[11px]"
        />
        {validation && (
          <div className="mt-2">
            {validation.status === 'schema-error' && (
              <p className="text-destructive">{t('format.schema.schemaError', { message: validation.message })}</p>
            )}
            {validation.status === 'valid' && <p className="text-success">{t('format.schema.valid')}</p>}
            {validation.status === 'invalid' && (
              <ul className="flex flex-col gap-1 text-destructive">
                {validation.errors.map((err, i) => (
                  <li key={i} className="font-mono">
                    {err}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
