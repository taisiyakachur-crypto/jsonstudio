import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from '@/i18n'
import { SOURCE_FORMATS, type SourceFormat } from '@/lib/parsers'
import type { TranslationKey } from '@/i18n'

const DELIMITERS: { value: string; labelKey: TranslationKey }[] = [
  { value: ',', labelKey: 'parse.csvDelimiter.comma' },
  { value: '\t', labelKey: 'parse.csvDelimiter.tab' },
  { value: ';', labelKey: 'parse.csvDelimiter.semicolon' },
]

export function FormatSelector({
  sourceFormat,
  detectedFormat,
  onSourceFormatChange,
  csvDelimiter,
  onCsvDelimiterChange,
}: {
  sourceFormat: SourceFormat
  detectedFormat: Exclude<SourceFormat, 'auto'>
  onSourceFormatChange: (format: SourceFormat) => void
  csvDelimiter: string
  onCsvDelimiterChange: (delimiter: string) => void
}) {
  const { t } = useTranslation()
  const effectiveFormat = sourceFormat === 'auto' ? detectedFormat : sourceFormat

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{t('parse.format.title')}</span>
        <Select value={sourceFormat} onValueChange={(v) => onSourceFormatChange(v as SourceFormat)}>
          <SelectTrigger className="h-8 w-52 text-xs">
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

      {sourceFormat === 'auto' && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {t('parse.detected', { format: t(`parse.format.${detectedFormat}` as TranslationKey) })}
        </span>
      )}

      {effectiveFormat === 'csv' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('parse.csvDelimiter')}</span>
          <Select value={csvDelimiter} onValueChange={onCsvDelimiterChange}>
            <SelectTrigger className="h-8 w-40 text-xs">
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
  )
}
