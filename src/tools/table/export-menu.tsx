import { ChevronDown, Download } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslation } from '@/i18n'

export function ExportMenu({
  onExport,
  onExportXlsx,
}: {
  onExport: (format: 'csv' | 'markdown' | 'json') => void
  onExportXlsx: () => void
}) {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium hover:bg-accent">
          <Download className="h-3.5 w-3.5" />
          {t('table.export.title')}
          <ChevronDown className="h-2.5 w-2.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onExport('csv')}>{t('table.export.csv')}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onExport('markdown')}>{t('table.export.markdown')}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onExport('json')}>{t('table.export.json')}</DropdownMenuItem>
        <DropdownMenuItem onSelect={onExportXlsx}>{t('table.export.xlsx')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
