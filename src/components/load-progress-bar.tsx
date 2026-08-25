import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n'
import { formatBytes } from '@/lib/big-file'
import type { LoadProgress } from '@/types/json-doc'

export function LoadProgressBar({
  progress,
  onCancel,
}: {
  progress: LoadProgress | null
  onCancel: () => void
}) {
  const { t, locale } = useTranslation()
  const pct =
    progress && progress.totalBytes > 0
      ? Math.min(100, Math.round((progress.loadedBytes / progress.totalBytes) * 100))
      : null

  return (
    <div className="flex flex-col gap-2 p-8">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {progress
            ? t('bigFile.progress', {
                loaded: formatBytes(progress.loadedBytes, locale),
                total: formatBytes(progress.totalBytes, locale),
              })
            : t('bigFile.starting')}
        </span>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={pct === null ? 'h-full w-1/3 animate-pulse rounded-full bg-primary' : 'h-full rounded-full bg-primary transition-[width]'}
          style={pct === null ? undefined : { width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
