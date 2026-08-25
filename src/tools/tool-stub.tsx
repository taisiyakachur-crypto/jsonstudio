import type { LucideIcon } from 'lucide-react'
import { useTranslation, type TranslationKey } from '@/i18n'

interface ToolStubProps {
  icon: LucideIcon
  nameKey: TranslationKey
  descriptionKey: TranslationKey
}

/** Placeholder pane shown for tools not yet implemented (stage 1 scaffold). */
export function ToolStub({ icon: Icon, nameKey, descriptionKey }: ToolStubProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold">{t(nameKey)}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{t(descriptionKey)}</p>
      <p className="mt-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
        {t('common.comingInStage')}
      </p>
    </div>
  )
}
