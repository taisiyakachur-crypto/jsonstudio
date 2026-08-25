import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEFAULT_DIFF_OPTIONS, type DiffOptions } from '@/lib/diff'
import { useTranslation } from '@/i18n'

function countActiveOptions(options: DiffOptions): number {
  let count = 0
  if (options.ignoreArrayOrder) count++
  if (options.arrayKeyField.trim() !== '') count++
  if (options.ignoreCase) count++
  if (options.ignoredKeys.length > 0) count++
  if (options.treatNullEmptyMissingAsEqual) count++
  if (options.numericTolerance !== DEFAULT_DIFF_OPTIONS.numericTolerance) count++
  if (options.ignoreTypes) count++
  return count
}

function parseIgnoredKeys(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export function DiffOptionsPanel({
  options,
  onChange,
}: {
  options: DiffOptions
  onChange: (options: DiffOptions) => void
}) {
  const { t } = useTranslation()
  const [ignoredKeysText, setIgnoredKeysText] = useState(() => options.ignoredKeys.join(', '))

  useEffect(() => {
    setIgnoredKeysText(options.ignoredKeys.join(', '))
    // Only resync from external state (e.g. tab switch); typing keeps its own draft below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function set<K extends keyof DiffOptions>(key: K, value: DiffOptions[K]) {
    onChange({ ...options, [key]: value })
  }

  const activeCount = countActiveOptions(options)

  return (
    <details className="shrink-0 border-b border-border text-sm">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
        {t('compare.options.title')}
        {activeCount > 0 && (
          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
            {activeCount}
          </span>
        )}
      </summary>
      <div className="flex flex-col gap-3 border-t border-border p-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={options.ignoreArrayOrder}
              onCheckedChange={(v) => set('ignoreArrayOrder', v === true)}
            />
            <span className="text-xs">{t('compare.options.ignoreArrayOrder')}</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={options.ignoreCase}
              onCheckedChange={(v) => set('ignoreCase', v === true)}
            />
            <span className="text-xs">{t('compare.options.ignoreCase')}</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={options.treatNullEmptyMissingAsEqual}
              onCheckedChange={(v) => set('treatNullEmptyMissingAsEqual', v === true)}
            />
            <span className="text-xs">{t('compare.options.treatNullEmptyMissingAsEqual')}</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={options.ignoreTypes}
              onCheckedChange={(v) => set('ignoreTypes', v === true)}
            />
            <span className="text-xs">{t('compare.options.ignoreTypes')}</span>
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">
              {t('compare.options.arrayKeyField')}
            </Label>
            <Input
              value={options.arrayKeyField}
              onChange={(e) => set('arrayKeyField', e.target.value)}
              placeholder={t('compare.options.arrayKeyFieldPlaceholder')}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">
              {t('compare.options.numericTolerance')}
            </Label>
            <Input
              type="number"
              min={0}
              step="any"
              value={options.numericTolerance}
              onChange={(e) => set('numericTolerance', Number(e.target.value) || 0)}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">
              {t('compare.options.ignoredKeys')}
            </Label>
            <Input
              value={ignoredKeysText}
              onChange={(e) => {
                setIgnoredKeysText(e.target.value)
                set('ignoredKeys', parseIgnoredKeys(e.target.value))
              }}
              placeholder={t('compare.options.ignoredKeysPlaceholder')}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>
    </details>
  )
}
