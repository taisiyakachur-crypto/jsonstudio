import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/store/settings-store'

function resolve(theme: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** The actually-rendered light/dark theme, following the system when set to 'system'. */
export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useSettingsStore((s) => s.theme)
  const [resolved, setResolved] = useState(() => resolve(theme))

  useEffect(() => {
    setResolved(resolve(theme))
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => setResolved(resolve('system'))
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [theme])

  return resolved
}
