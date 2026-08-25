import type { DiffStatus } from '@/lib/diff'
import type { NWayRow } from '@/lib/diff-n-way'
import { cn } from '@/lib/utils'

const CELL_BG: Record<DiffStatus, string> = {
  added: 'bg-diff-added/60',
  removed: 'bg-diff-removed/60',
  changed: 'bg-diff-changed/60',
  same: '',
}

/** N synchronized columns (one per panel), each cell colored by that panel's own status
 *  relative to the reference (panel 0). Scrolls as a single unit -- no separate per-column
 *  scroll containers to keep in sync. */
export function SideBySideView({
  rows,
  panelTitles,
  className,
}: {
  rows: NWayRow[]
  panelTitles: string[]
  className?: string
}) {
  return (
    <div className={cn('overflow-auto', className)}>
      <div className="grid min-w-max" style={{ gridTemplateColumns: `220px repeat(${panelTitles.length}, minmax(180px, 1fr))` }}>
        <div className="sticky top-0 z-10 border-b border-r border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground">
          Шлях
        </div>
        {panelTitles.map((title, i) => (
          <div
            key={i}
            className="sticky top-0 z-10 truncate border-b border-r border-border bg-background px-3 py-2 text-xs font-medium last:border-r-0"
            title={title}
          >
            {title}
          </div>
        ))}

        {rows.map((row) => (
          <RowCells key={JSON.stringify(row.path)} row={row} />
        ))}

        {rows.length === 0 && (
          <div
            className="col-span-full px-3 py-6 text-center text-sm text-muted-foreground"
            style={{ gridColumn: `1 / span ${panelTitles.length + 1}` }}
          >
            —
          </div>
        )}
      </div>
    </div>
  )
}

function RowCells({ row }: { row: NWayRow }) {
  return (
    <>
      <div className="truncate border-b border-r border-border px-3 py-1.5 font-mono text-xs">
        {row.pathLabel}
      </div>
      {row.previews.map((preview, i) => (
        <div
          key={i}
          className={cn(
            'truncate border-b border-r border-border px-3 py-1.5 font-mono text-xs last:border-r-0',
            CELL_BG[row.statuses[i]!],
          )}
        >
          {preview ?? '—'}
        </div>
      ))}
    </>
  )
}
