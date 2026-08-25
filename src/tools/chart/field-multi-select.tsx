import { ChevronsUpDown } from 'lucide-react'
import { ColumnTypeBadge } from '@/components/column-type-badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { ColumnType } from '@/lib/flatten'
import { cn } from '@/lib/utils'

export function FieldMultiSelect({
  fields,
  fieldTypes,
  value,
  onChange,
  placeholder,
  className,
}: {
  fields: string[]
  fieldTypes: Record<string, ColumnType>
  value: string[]
  onChange: (fields: string[]) => void
  placeholder: string
  className?: string
}) {
  function toggle(field: string, checked: boolean) {
    onChange(checked ? [...value, field] : value.filter((f) => f !== field))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex h-8 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-xs shadow-sm hover:bg-accent',
            className,
          )}
        >
          <span className="truncate">{value.length > 0 ? value.join(', ') : placeholder}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1">
        <div className="max-h-72 overflow-y-auto">
          {fields.map((field) => (
            <label
              key={field}
              className="flex items-center justify-between gap-2 rounded-sm px-1.5 py-1.5 text-sm hover:bg-accent"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Checkbox
                  checked={value.includes(field)}
                  onCheckedChange={(v) => toggle(field, v === true)}
                />
                <span className="truncate font-mono text-xs">{field}</span>
              </span>
              <ColumnTypeBadge type={fieldTypes[field] ?? 'string'} />
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
