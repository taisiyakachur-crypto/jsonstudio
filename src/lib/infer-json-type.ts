import { isJsonArray, isJsonObject, type JsonValue } from '@/types/json'

export type InferredType =
  | { kind: 'string' }
  | { kind: 'number' }
  | { kind: 'boolean' }
  | { kind: 'null' }
  | { kind: 'unknown' }
  | { kind: 'array'; of: InferredType }
  | { kind: 'object'; fields: Map<string, { type: InferredType; optional: boolean }> }
  | { kind: 'union'; options: InferredType[] }

function mergeObjects(
  a: Extract<InferredType, { kind: 'object' }>,
  b: Extract<InferredType, { kind: 'object' }>,
): Extract<InferredType, { kind: 'object' }> {
  const fields = new Map<string, { type: InferredType; optional: boolean }>()
  const allKeys = new Set([...a.fields.keys(), ...b.fields.keys()])
  for (const key of allKeys) {
    const inA = a.fields.get(key)
    const inB = b.fields.get(key)
    if (inA && inB) {
      fields.set(key, { type: mergeTypes(inA.type, inB.type), optional: inA.optional || inB.optional })
    } else {
      fields.set(key, { type: (inA ?? inB)!.type, optional: true })
    }
  }
  return { kind: 'object', fields }
}

/** Flattens nested unions, merges same-kind object/array entries pairwise, and dedupes
 *  identical primitive kinds -- so a union never contains e.g. two separate 'object' entries. */
function unionOf(types: InferredType[]): InferredType {
  const objects = types.filter((t): t is Extract<InferredType, { kind: 'object' }> => t.kind === 'object')
  const arrays = types.filter((t): t is Extract<InferredType, { kind: 'array' }> => t.kind === 'array')
  const others = types.filter((t) => t.kind !== 'object' && t.kind !== 'array' && t.kind !== 'unknown')

  const merged: InferredType[] = []
  if (objects.length > 0) merged.push(objects.reduce((a, b) => mergeObjects(a, b)))
  if (arrays.length > 0) {
    merged.push(arrays.reduce((a, b) => ({ kind: 'array', of: mergeTypes(a.of, b.of) })))
  }
  const seenKinds = new Set<string>()
  for (const o of others) {
    if (!seenKinds.has(o.kind)) {
      seenKinds.add(o.kind)
      merged.push(o)
    }
  }

  if (merged.length === 0) return { kind: 'unknown' }
  if (merged.length === 1) return merged[0]!
  return { kind: 'union', options: merged }
}

/** Merges two independently-inferred types into one that describes both -- used to combine
 *  the element types of an array, or a field's type across multiple samples of an object. */
export function mergeTypes(a: InferredType, b: InferredType): InferredType {
  if (a.kind === 'unknown') return b
  if (b.kind === 'unknown') return a
  if (a.kind === 'object' && b.kind === 'object') return mergeObjects(a, b)
  if (a.kind === 'array' && b.kind === 'array') return { kind: 'array', of: mergeTypes(a.of, b.of) }
  const optionsA = a.kind === 'union' ? a.options : [a]
  const optionsB = b.kind === 'union' ? b.options : [b]
  return unionOf([...optionsA, ...optionsB])
}

/** Infers a structural type from a JSON value. Array elements are merged into a single element
 *  type (fields missing from some elements become optional), rather than one type per index. */
export function inferType(value: JsonValue): InferredType {
  if (value === null) return { kind: 'null' }
  if (typeof value === 'string') return { kind: 'string' }
  if (typeof value === 'number') return { kind: 'number' }
  if (typeof value === 'boolean') return { kind: 'boolean' }
  if (isJsonArray(value)) {
    if (value.length === 0) return { kind: 'array', of: { kind: 'unknown' } }
    return { kind: 'array', of: value.map(inferType).reduce((a, b) => mergeTypes(a, b)) }
  }
  if (isJsonObject(value)) {
    const fields = new Map<string, { type: InferredType; optional: boolean }>()
    for (const key of Object.keys(value)) {
      fields.set(key, { type: inferType(value[key] as JsonValue), optional: false })
    }
    return { kind: 'object', fields }
  }
  return { kind: 'unknown' }
}
