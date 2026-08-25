import { ShieldCheck } from 'lucide-react'
import { useTranslation } from '@/i18n'

export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="flex h-8 shrink-0 items-center gap-1.5 border-t border-border px-3 text-xs text-muted-foreground">
      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
      <span className="truncate">{t('app.footer.privacy')}</span>
    </footer>
  )
}
