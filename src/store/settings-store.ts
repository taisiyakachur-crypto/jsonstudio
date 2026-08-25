import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Locale = 'uk' | 'en'
export type Theme = 'light' | 'dark' | 'system'

interface SettingsState {
  locale: Locale
  theme: Theme
  setLocale: (locale: Locale) => void
  setTheme: (theme: Theme) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: 'uk',
      theme: 'system',
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'json-studio-settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

export function applyThemeClass(theme: Theme): void {
  const root = document.documentElement
  const resolved =
    theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme
  root.classList.toggle('dark', resolved === 'dark')
}
