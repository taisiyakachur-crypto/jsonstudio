import { CheckCircle2, XCircle } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { formatBytes } from '@/lib/big-file'
import type { JsonValidationResult } from '@/lib/validate-json'

export function ValidityBar({
  text,
  result,
  nodeCount,
  maxDepth,
}: {
  text: string
  result: JsonValidationResult
  nodeCount?: number
  maxDepth?: number
}) {
  const { t, locale } = useTranslation()

  if (text.trim() === '') return null

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-3 py-1.5 text-xs">
      {result.valid ? (
        <span className="flex items-center gap-1 font-medium text-success">
          <CheckCircle2 className="h-3.5 w-3.5" /> {t('common.valid')}
        </span>
      ) : (
        <span className="flex items-center gap-1 font-medium text-destructive">
          <XCircle className="h-3.5 w-3.5" /> {result.error?.message ?? t('common.invalid')}
        </span>
      )}
      {result.valid && nodeCount !== undefined && maxDepth !== undefined && (
        <span className="text-muted-foreground">
          {t('jsonInput.stats', {
            size: formatBytes(new Blob([text]).size, locale),
            nodes: nodeCount,
            depth: maxDepth,
          })}
        </span>
      )}
    </div>
  )
}
