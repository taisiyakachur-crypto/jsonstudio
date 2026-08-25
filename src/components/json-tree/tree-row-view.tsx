import { ChevronRight, Copy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/i18n'
import { formatJsonPath } from '@/lib/json-path'
import { cn } from '@/lib/utils'
import type { LoadMoreRow, TreeNodeRow } from './types'

const TYPE_COLOR: Record<TreeNodeRow['type'], string> = {
  string: 'text-emerald-600 dark:text-emerald-400',
  number: 'text-sky-600 dark:text-sky-400',
  boolean: 'text-purple-600 dark:text-purple-400',
  null: 'text-muted-foreground',
  object: 'text-muted-foreground',
  array: 'text-muted-foreground',
}

const INDENT_PX = 16
const ROW_LEFT_PAD_PX = 8

export function TreeNodeRowView({
  row,
  onToggle,
}: {
  row: TreeNodeRow
  onToggle: (row: TreeNodeRow) => void
}) {
  const { t } = useTranslation()

  function copyPath() {
    const path = formatJsonPath(row.path)
    void navigator.clipboard.writeText(path).then(() => {
      toast.success(t('jsonTree.pathCopied'), { description: path })
    })
  }

  return (
    <div
      className="group flex h-7 items-center gap-1 pr-2 text-sm hover:bg-accent/60"
      style={{ paddingLeft: row.depth * INDENT_PX + ROW_LEFT_PAD_PX }}
    >
      <button
        onClick={() => row.hasChildren && onToggle(row)}
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center',
          !row.hasChildren && 'invisible',
        )}
        aria-label={row.expanded ? 'collapse' : 'expand'}
      >
        <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', row.expanded && 'rotate-90')} />
      </button>
      <span className="shrink-0 font-mono text-muted-foreground">{row.label}</span>
      <span className="shrink-0 text-muted-foreground">:</span>
      <span className={cn('truncate font-mono', TYPE_COLOR[row.type])}>{row.preview}</span>
      <button
        onClick={copyPath}
        className="ml-auto hidden shrink-0 rounded-sm p-0.5 text-muted-foreground hover:bg-accent group-hover:flex"
        title={t('jsonTree.copyPath')}
        aria-label={t('jsonTree.copyPath')}
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  )
}

export function LoadMoreRowView({
  row,
  onLoadMore,
}: {
  row: LoadMoreRow
  onLoadMore: (row: LoadMoreRow) => void
}) {
  const { t } = useTranslation()
  return (
    <div
      className="flex h-7 items-center"
      style={{ paddingLeft: row.depth * INDENT_PX + ROW_LEFT_PAD_PX }}
    >
      <button
        onClick={() => !row.loading && onLoadMore(row)}
        disabled={row.loading}
        className="flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-xs text-primary hover:bg-accent disabled:opacity-60"
      >
        {row.loading && <Loader2 className="h-3 w-3 animate-spin" />}
        {t('jsonTree.loadMore', { count: row.remaining })}
      </button>
    </div>
  )
}
