import { useSettingsStore } from '@/store/settings-store'
import en from './en.json'
import uk from './uk.json'

const dictionaries = { uk, en } as const

export type TranslationKey = keyof typeof uk

type Vars = Record<string, string | number>

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  )
}

export function translate(locale: 'uk' | 'en', key: TranslationKey, vars?: Vars): string {
  const dict = dictionaries[locale] as Record<string, string>
  const template = dict[key] ?? dictionaries.uk[key] ?? key
  return interpolate(template, vars)
}

export function useTranslation() {
  const locale = useSettingsStore((s) => s.locale)
  const t = (key: TranslationKey, vars?: Vars) => translate(locale, key, vars)
  return { t, locale }
}
