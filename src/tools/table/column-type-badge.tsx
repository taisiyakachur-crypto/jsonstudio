import type { ColumnType } from '@/lib/flatten'
import { cn } from '@/lib/utils'

const TYPE_COLOR: Record<ColumnType, string> = {
  string: 'text-emerald-600 dark:text-emerald-400 border-emerald-600/30',
  number: 'text-sky-600 dark:text-sky-400 border-sky-600/30',
  boolean: 'text-purple-600 dark:text-purple-400 border-purple-600/30',
  date: 'text-amber-600 dark:text-amber-400 border-amber-600/30',
  object: 'text-muted-foreground border-border',
  null: 'text-muted-foreground border-border',
  mixed: 'text-destructive border-destructive/30',
}

export function ColumnTypeBadge({ type, className }: { type: ColumnType; className?: string }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded border px-1 font-mono text-[10px] font-normal uppercase leading-4',
        TYPE_COLOR[type],
        className,
      )}
    >
      {type}
    </span>
  )
}
