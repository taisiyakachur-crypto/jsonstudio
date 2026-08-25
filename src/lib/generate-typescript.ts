import { inferType, type InferredType } from './infer-json-type'
import type { JsonValue } from '@/types/json'

const VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/

function pascalCase(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9]+/g, ' ').trim()
  if (cleaned === '') return 'Value'
  return cleaned
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

function singularize(name: string): string {
  if (/ies$/i.test(name)) return `${name.slice(0, -3)}y`
  if (/s$/i.test(name) && !/ss$/i.test(name)) return name.slice(0, -1)
  return `${name}Item`
}

function uniqueName(base: string, used: Set<string>): string {
  let name = base
  let n = 2
  while (used.has(name)) {
    name = `${base}${n}`
    n++
  }
  used.add(name)
  return name
}

function typeToString(t: InferredType, suggestedName: string, interfaces: string[], used: Set<string>): string {
  switch (t.kind) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'null':
      return 'null'
    case 'unknown':
      return 'unknown'
    case 'union': {
      const rendered = t.options.map((o) => typeToString(o, suggestedName, interfaces, used))
      return [...new Set(rendered)].join(' | ')
    }
    case 'array': {
      const inner = typeToString(t.of, singularize(suggestedName), interfaces, used)
      return VALID_IDENTIFIER.test(inner) || inner.endsWith('[]') ? `${inner}[]` : `(${inner})[]`
    }
    case 'object': {
      const name = uniqueName(pascalCase(suggestedName), used)
      const lines = [...t.fields.entries()].map(([key, { type, optional }]) => {
        const propType = typeToString(type, key, interfaces, used)
        const safeKey = VALID_IDENTIFIER.test(key) ? key : JSON.stringify(key)
        return `  ${safeKey}${optional ? '?' : ''}: ${propType}`
      })
      interfaces.push(lines.length > 0 ? `interface ${name} {\n${lines.join('\n')}\n}` : `interface ${name} {}`)
      return name
    }
  }
}

/**
 * Generates TypeScript interfaces from a JSON value. Array elements are merged into a single
 * element type rather than one per index (see infer-json-type.ts) -- the common case of an
 * array of same-shaped objects gets one interface, not thousands.
 */
export function generateTypeScript(root: JsonValue, rootName = 'Root'): string {
  const inferred = inferType(root)
  const interfaces: string[] = []
  const used = new Set<string>()
  const rootExpr = typeToString(inferred, rootName, interfaces, used)
  const supporting = [...interfaces].reverse()

  if (inferred.kind === 'object') {
    return supporting.join('\n\n')
  }
  const header = `export type ${pascalCase(rootName)} = ${rootExpr};`
  return supporting.length > 0 ? `${header}\n\n${supporting.join('\n\n')}` : header
}
