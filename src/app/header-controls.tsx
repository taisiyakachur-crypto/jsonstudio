import { Laptop, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from '@/i18n'
import type { Locale, Theme } from '@/store/settings-store'
import { useSettingsStore } from '@/store/settings-store'

const THEME_ICONS: Record<Theme, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  system: Laptop,
}

export function HeaderControls() {
  const { t } = useTranslation()
  const locale = useSettingsStore((s) => s.locale)
  const theme = useSettingsStore((s) => s.theme)
  const setLocale = useSettingsStore((s) => s.setLocale)
  const setTheme = useSettingsStore((s) => s.setTheme)

  const ThemeIcon = THEME_ICONS[theme]
  const order: Theme[] = ['light', 'dark', 'system']

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon-sm"
        title={t('settings.theme')}
        onClick={() => {
          const idx = order.indexOf(theme)
          setTheme(order[(idx + 1) % order.length] as Theme)
        }}
      >
        <ThemeIcon className="h-4 w-4" />
      </Button>
      <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
        <SelectTrigger className="h-8 w-[84px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="uk">UK</SelectItem>
          <SelectItem value="en">EN</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
