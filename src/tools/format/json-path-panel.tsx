import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/i18n'
import { queryJsonPath } from '@/lib/json-path-query'
import type { JsonValue } from '@/types/json'

export function JsonPathPanel({
  value,
  query,
  onQueryChange,
}: {
  value: JsonValue | null
  query: string
  onQueryChange: (query: string) => void
}) {
  const { t } = useTranslation()
  const result = useMemo(() => (value === null ? null : queryJsonPath(value, query)), [value, query])

  return (
    <div className="flex flex-col gap-2 text-xs">
      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={t('format.jsonPath.placeholder')}
        className="h-8 font-mono text-xs"
      />
      {result === null || (result.status === 'ok' && query.trim() === '') ? (
        <p className="text-muted-foreground">{t('format.jsonPath.empty')}</p>
      ) : result.status === 'error' ? (
        <p className="text-destructive">{result.message}</p>
      ) : (
        <>
          <p className="text-muted-foreground">{t('format.jsonPath.resultCount', { count: result.results.length })}</p>
          <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted/30 p-2 font-mono text-[11px]">
            {JSON.stringify(result.results, null, 2)}
          </pre>
        </>
      )}
    </div>
  )
}
