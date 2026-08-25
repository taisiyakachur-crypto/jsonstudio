import { Loader2 } from 'lucide-react'
import { FixedSizeList, type ListChildComponentProps } from 'react-window'
import { useElementSize } from '@/hooks/use-element-size'
import { useTranslation } from '@/i18n'
import { LoadMoreRowView, TreeNodeRowView } from './tree-row-view'
import type { GetChildrenFn } from './types'
import { useJsonTreeRows } from './use-json-tree-rows'

const ROW_HEIGHT = 28

export function JsonTree({
  docId,
  getChildren,
  className,
}: {
  docId: string | null
  getChildren: GetChildrenFn
  className?: string
}) {
  const { t } = useTranslation()
  const { rows, rootLoading, toggleExpand, loadMore } = useJsonTreeRows(docId, getChildren)
  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>()

  function Row({ index, style }: ListChildComponentProps) {
    const row = rows[index]
    if (!row) return null
    return (
      <div style={style}>
        {row.kind === 'node' ? (
          <TreeNodeRowView row={row} onToggle={toggleExpand} />
        ) : (
          <LoadMoreRowView row={row} onLoadMore={loadMore} />
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={className}>
      {rootLoading ? (
        <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('jsonTree.loading')}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {t('jsonTree.empty')}
        </div>
      ) : width > 0 && height > 0 ? (
        <FixedSizeList
          height={height}
          width={width}
          itemCount={rows.length}
          itemSize={ROW_HEIGHT}
          itemKey={(index) => rows[index]?.id ?? index}
        >
          {Row}
        </FixedSizeList>
      ) : null}
    </div>
  )
}
