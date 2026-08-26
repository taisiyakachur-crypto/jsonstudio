import { Copy, MoreVertical, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslation } from '@/i18n'
import { useTabsStore } from '@/store/tabs-store'

/**
 * Duplicate/close for the active tab, reachable by touch. The desktop TabBar's own duplicate/close
 * icons are hover-revealed (`opacity-0 group-hover:opacity-100`), so they're unreachable on a
 * touchscreen; this "⋮" button (mockup 2h's mobile header) is the mobile equivalent.
 */
export function MobileTabActions() {
  const { t } = useTranslation()
  const activeTabId = useTabsStore((s) => s.activeTabId)
  const duplicateTab = useTabsStore((s) => s.duplicateTab)
  const closeTab = useTabsStore((s) => s.closeTab)

  if (!activeTabId) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={t('tabs.moreActions')}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => duplicateTab(activeTabId)}>
          <Copy /> {t('tabs.duplicate')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => closeTab(activeTabId)}>
          <X /> {t('tabs.close')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
