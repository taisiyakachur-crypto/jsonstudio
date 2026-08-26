import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from '@/i18n'

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250, 500]

export function PaginationBar({
  page,
  pageCount,
  totalFiltered,
  totalRows,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  pageCount: number
  totalFiltered: number
  totalRows: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
      <span>{t('table.filteredRows', { filtered: totalFiltered, total: totalRows })}</span>
      <div className="flex items-center gap-2">
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-7 w-[90px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {t('table.pageSize')}: {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          aria-label={t('table.prevPage')}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span>{t('table.page', { page: pageCount === 0 ? 0 : page + 1, pages: pageCount })}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label={t('table.nextPage')}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
