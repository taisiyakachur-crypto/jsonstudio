import { TriangleAlert } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { formatBytes } from '@/lib/big-file'

export function BigFileBanner({ byteSize }: { byteSize: number }) {
  const { t, locale } = useTranslation()
  return (
    <div className="flex items-start gap-2 border-b border-warning/40 bg-warning/10 px-3 py-2 text-sm">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <span>{t('bigFile.banner', { size: formatBytes(byteSize, locale) })}</span>
    </div>
  )
}
