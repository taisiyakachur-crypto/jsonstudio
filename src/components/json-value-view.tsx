import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { isJsonArray, isJsonObject, jsonNodeType, type JsonValue } from '@/types/json'
import { cn } from '@/lib/utils'

const TYPE_COLOR: Record<string, string> = {
  string: 'text-emerald-600 dark:text-emerald-400',
  number: 'text-sky-600 dark:text-sky-400',
  boolean: 'text-purple-600 dark:text-purple-400',
  null: 'text-muted-foreground',
}

const INDENT_PX = 16

function scalarPreview(value: JsonValue): string {
  if (typeof value === 'string') return JSON.stringify(value)
  return JSON.stringify(value)
}

/**
 * A small, self-contained recursive JSON viewer for an already in-memory value (no worker,
 * no pagination) -- used for the Table tool's per-cell popup, where the value is small enough
 * (a single row's cell) that the paginated `JsonTree` machinery would be overkill.
 */
export function JsonValueView({ value, depth = 0 }: { value: JsonValue; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const type = jsonNodeType(value)

  if (type !== 'object' && type !== 'array') {
    return <span className={cn('font-mono text-sm', TYPE_COLOR[type])}>{scalarPreview(value)}</span>
  }

  const entries: [string, JsonValue][] = isJsonArray(value)
    ? value.map((v, i) => [String(i), v])
    : Object.entries(isJsonObject(value) ? value : {})

  return (
    <div style={{ paddingLeft: depth === 0 ? 0 : INDENT_PX }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-1 font-mono text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 transition-transform', expanded && 'rotate-90')} />
        {isJsonArray(value) ? `[${entries.length}]` : `{${entries.length}}`}
      </button>
      {expanded && (
        <div>
          {entries.map(([key, child]) => (
            <div key={key} className="flex gap-1.5" style={{ paddingLeft: INDENT_PX }}>
              <span className="shrink-0 font-mono text-sm text-muted-foreground">{key}:</span>
              <JsonValueView value={child} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
