import { ParseInputError } from './errors'
import { isJsonArray, type JsonObject, type JsonValue } from '@/types/json'

function elementToJson(el: Element): JsonValue {
  const obj: JsonObject = {}

  for (const attr of Array.from(el.attributes)) {
    obj[`@${attr.name}`] = attr.value
  }

  const childElements = Array.from(el.children)
  for (const child of childElements) {
    const value = elementToJson(child)
    const existing = obj[child.tagName]
    if (existing === undefined) {
      obj[child.tagName] = value
    } else if (isJsonArray(existing)) {
      existing.push(value)
    } else {
      obj[child.tagName] = [existing, value]
    }
  }

  const text = Array.from(el.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent ?? '')
    .join('')
    .trim()

  if (childElements.length === 0) {
    // Leaf element: attributes only -> keep them and add #text; no attributes -> just the string.
    return Object.keys(obj).length > 0 ? (text ? { ...obj, '#text': text } : obj) : text
  }
  if (text) obj['#text'] = text
  return obj
}

/** Parses an XML document into JSON: attributes become `@name` keys, text content becomes
 *  `#text` when siblings exist (or the bare string for a childless, attribute-less element),
 *  and repeated same-name children become an array. The root tag is the top-level key. */
export function parseXml(text: string): JsonValue {
  if (typeof DOMParser === 'undefined') {
    throw new ParseInputError('XML-розбір недоступний у цьому середовищі.')
  }
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  const errorNode = doc.querySelector('parsererror')
  if (errorNode) {
    throw new ParseInputError(`Некоректний XML: ${errorNode.textContent?.trim() ?? 'помилка розбору'}`)
  }
  const root = doc.documentElement
  if (!root) {
    throw new ParseInputError('У документі немає кореневого елемента.')
  }
  return { [root.tagName]: elementToJson(root) }
}
