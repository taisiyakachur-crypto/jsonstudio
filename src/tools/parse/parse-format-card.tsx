import { Wand2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'
import { SOURCE_FORMATS, type SourceFormat } from '@/lib/parsers'

const DELIMITERS: { value: string; labelKey: TranslationKey }[] = [
  { value: ',', labelKey: 'parse.csvDelimiter.comma' },
  { value: '\t', labelKey: 'parse.csvDelimiter.tab' },
  { value: ';', labelKey: 'parse.csvDelimiter.semicolon' },
]

export function ParseFormatCard({
  sourceFormat,
  detectedFormat,
  onSourceFormatChange,
  csvDelimiter,
  onCsvDelimiterChange,
  columnCount,
}: {
  sourceFormat: SourceFormat
  detectedFormat: Exclude<SourceFormat, 'auto'>
  onSourceFormatChange: (format: SourceFormat) => void
  csvDelimiter: string
  onCsvDelimiterChange: (delimiter: string) => void
  /** Column count of the parsed CSV/TSV, shown in the subtitle when available. */
  columnCount?: number
}) {
  const { t } = useTranslation()
  const effectiveFormat = sourceFormat === 'auto' ? detectedFormat : sourceFormat
  const formatLabel = t(`parse.format.${effectiveFormat}` as TranslationKey)

  return (
    <div className="flex shrink-0 items-center gap-2.5 rounded-xl bg-card px-3.5 py-2.5 shadow-[0_0_0_1px_hsl(var(--primary)/0.28)]">
      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
        <Wand2 className="h-[15px] w-[15px]" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">
          {sourceFormat === 'auto' ? t('parse.detected', { format: formatLabel }) : formatLabel}
        </span>
        {effectiveFormat === 'csv' && (
          <span className="block truncate text-[11px] text-muted-foreground">
            {t('parse.csvDelimiter')} —{' '}
            {t(
              (DELIMITERS.find((d) => d.value === csvDelimiter)?.labelKey ??
                'parse.csvDelimiter.comma') as TranslationKey,
            )}
            {columnCount !== undefined && ` · ${t('parse.columnsCount', { count: columnCount })}`}
          </span>
        )}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <button className="shrink-0 text-xs font-medium text-primary hover:underline">
            {t('parse.format.change')}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[280px] p-3">
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{t('parse.format.title')}</label>
              <Select value={sourceFormat} onValueChange={(v) => onSourceFormatChange(v as SourceFormat)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">{t('parse.format.auto')}</SelectItem>
                  {SOURCE_FORMATS.map((format) => (
                    <SelectItem key={format} value={format}>
                      {t(`parse.format.${format}` as TranslationKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {effectiveFormat === 'csv' && (
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{t('parse.csvDelimiter')}</label>
                <Select value={csvDelimiter} onValueChange={onCsvDelimiterChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIMITERS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {t(d.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
