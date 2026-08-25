import { inferType, type InferredType } from './infer-json-type'
import type { JsonValue } from '@/types/json'

type SchemaNode = Record<string, unknown>

const PRIMITIVE_SCHEMA_TYPE: Partial<Record<InferredType['kind'], string>> = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  null: 'null',
}

function typeToSchema(t: InferredType): SchemaNode {
  switch (t.kind) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
      return { type: PRIMITIVE_SCHEMA_TYPE[t.kind] }
    case 'unknown':
      return {}
    case 'array':
      return { type: 'array', items: typeToSchema(t.of) }
    case 'object': {
      const properties: Record<string, SchemaNode> = {}
      const required: string[] = []
      for (const [key, { type, optional }] of t.fields) {
        properties[key] = typeToSchema(type)
        if (!optional) required.push(key)
      }
      const schema: SchemaNode = { type: 'object', properties }
      if (required.length > 0) schema.required = required
      return schema
    }
    case 'union': {
      const allPrimitive = t.options.every((o) => o.kind in PRIMITIVE_SCHEMA_TYPE)
      if (allPrimitive) {
        return { type: t.options.map((o) => PRIMITIVE_SCHEMA_TYPE[o.kind]) }
      }
      return { anyOf: t.options.map(typeToSchema) }
    }
  }
}

/** Generates a draft-07 JSON Schema describing the shape of `root`. */
export function generateJsonSchema(root: JsonValue): SchemaNode {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    ...typeToSchema(inferType(root)),
  }
}
