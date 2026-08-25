import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { JsonValueView } from '@/components/json-value-view'
import { useTranslation } from '@/i18n'
import type { JsonValue } from '@/types/json'

export function CellValuePopup({
  value,
  onClose,
}: {
  value: JsonValue | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  return (
    <Dialog open={value !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[70vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('table.cellPopupTitle')}</DialogTitle>
        </DialogHeader>
        {value !== null && <JsonValueView value={value} />}
      </DialogContent>
    </Dialog>
  )
}
