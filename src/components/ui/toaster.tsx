import { Toaster as Sonner } from 'sonner'
import { useSettingsStore } from '@/store/settings-store'

export function Toaster() {
  const theme = useSettingsStore((s) => s.theme)
  return (
    <Sonner
      theme={theme === 'system' ? 'system' : theme}
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: 'bg-popover text-popover-foreground border border-border shadow-lg',
        },
      }}
    />
  )
}
