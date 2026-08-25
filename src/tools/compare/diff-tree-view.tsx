import { ChevronRight, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FixedSizeList, type ListChildComponentProps } from 'react-window'
import { toast } from 'sonner'
import { useElementSize } from '@/hooks/use-element-size'
import { useTranslation } from '@/i18n'
import type { DiffNode, DiffStatus } from '@/lib/diff'
import { formatJsonPath } from '@/lib/json-path'
import { cn } from '@/lib/utils'
import type { JsonPathSegment } from '@/types/json-doc'

const ROW_HEIGHT = 28
const INDENT_PX = 16

function pathKey(path: JsonPathSegment[]): string {
  return JSON.stringify(path)
}

const ROW_BG: Record<DiffStatus, string> = {
  added: 'bg-diff-added/60',
  removed: 'bg-diff-removed/60',
  changed: 'bg-diff-changed/60',
  same: '',
}

const DOT: Record<DiffStatus, string> = {
  added: 'bg-emerald-500',
  removed: 'bg-rose-500',
  changed: 'bg-amber-500',
  same: 'bg-muted-foreground/30',
}

interface Row {
  node: DiffNode
  depth: number
}

function computeInitialExpanded(root: DiffNode): Set<string> {
  const expanded = new Set<string>()
  function walk(node: DiffNode) {
    if (!node.children) return
    if (node.status !== 'same') expanded.add(pathKey(node.path))
    for (const child of node.children) walk(child)
  }
  walk(root)
  return expanded
}

function flattenVisible(node: DiffNode, depth: number, expanded: Set<string>, out: Row[]): void {
  out.push({ node, depth })
  if (node.children && expanded.has(pathKey(node.path))) {
    for (const child of node.children) flattenVisible(child, depth + 1, expanded, out)
  }
}

function DiffRow({
  row,
  expanded,
  onToggle,
}: {
  row: Row
  expanded: boolean
  onToggle: (node: DiffNode) => void
}) {
  const { t } = useTranslation()
  const { node, depth } = row

  function copyPath() {
    const path = formatJsonPath(node.path)
    void navigator.clipboard.writeText(path).then(() => {
      toast.success(t('diffTree.pathCopied'), { description: path })
    })
  }

  const showBoth = node.status === 'changed' && !node.children
  const value =
    node.status === 'removed'
      ? node.leftPreview
      : node.status === 'added'
        ? node.rightPreview
        : node.status === 'same'
          ? node.leftPreview
          : null

  return (
    <div
      className={cn('group flex h-7 items-center gap-1 pr-2 text-sm', ROW_BG[node.status])}
      style={{ paddingLeft: depth * INDENT_PX + 8 }}
    >
      <button
        onClick={() => node.children && onToggle(node)}
        className={cn('flex h-4 w-4 shrink-0 items-center justify-center', !node.children && 'invisible')}
        aria-label={expanded ? 'collapse' : 'expand'}
      >
        <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-90')} />
      </button>
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT[node.status])} />
      <span className="shrink-0 font-mono text-muted-foreground">{node.key || '$'}</span>
      <span className="shrink-0 text-muted-foreground">:</span>
      {showBoth ? (
        <span className="truncate font-mono">
          <span className="text-rose-600 line-through dark:text-rose-400">{node.leftPreview}</span>
          <span className="mx-1 text-muted-foreground">→</span>
          <span className="text-emerald-600 dark:text-emerald-400">{node.rightPreview}</span>
        </span>
      ) : (
        <span className="truncate font-mono text-muted-foreground">{value}</span>
      )}
      <button
        onClick={copyPath}
        className="ml-auto hidden shrink-0 rounded-sm p-0.5 text-muted-foreground hover:bg-accent group-hover:flex"
        title={t('diffTree.copyPath')}
        aria-label={t('diffTree.copyPath')}
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  )
}

export function DiffTreeView({ root, className }: { root: DiffNode; className?: string }) {
  const [expanded, setExpanded] = useState(() => computeInitialExpanded(root))
  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>()

  const rows = useMemo(() => {
    const out: Row[] = []
    if (root.children) {
      for (const child of root.children) flattenVisible(child, 0, expanded, out)
    } else {
      out.push({ node: root, depth: 0 })
    }
    return out
  }, [root, expanded])

  function toggle(node: DiffNode) {
    setExpanded((prev) => {
      const next = new Set(prev)
      const key = pathKey(node.path)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function RenderRow({ index, style }: ListChildComponentProps) {
    const row = rows[index]
    if (!row) return null
    return (
      <div style={style}>
        <DiffRow row={row} expanded={expanded.has(pathKey(row.node.path))} onToggle={toggle} />
      </div>
    )
  }

  return (
    <div ref={containerRef} className={className}>
      {width > 0 && height > 0 && (
        <FixedSizeList
          height={height}
          width={width}
          itemCount={rows.length}
          itemSize={ROW_HEIGHT}
          itemKey={(index) => pathKey(rows[index]!.node.path)}
        >
          {RenderRow}
        </FixedSizeList>
      )}
    </div>
  )
}
