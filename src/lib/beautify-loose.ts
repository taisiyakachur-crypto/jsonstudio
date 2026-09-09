interface Token {
  type: 'open-brace' | 'open-bracket' | 'close-brace' | 'close-bracket' | 'comma' | 'colon' | 'text'
  text: string
}

const STRUCTURAL_CHARS = ' \t\n\r"\'{}[],:'

function tokenize(rawText: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const n = rawText.length

  while (i < n) {
    const ch = rawText[i]!

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++
      continue
    }

    // A string token, tolerating being unterminated at EOF -- whatever's there is kept verbatim,
    // no closing quote is invented.
    if (ch === '"' || ch === "'") {
      const quote = ch
      let j = i + 1
      let escaped = false
      while (j < n) {
        const c = rawText[j]!
        if (escaped) escaped = false
        else if (c === '\\') escaped = true
        else if (c === quote) {
          j++
          break
        }
        j++
      }
      tokens.push({ type: 'text', text: rawText.slice(i, j) })
      i = j
      continue
    }

    if (ch === '/' && rawText[i + 1] === '/') {
      let j = i
      while (j < n && rawText[j] !== '\n') j++
      tokens.push({ type: 'text', text: rawText.slice(i, j) })
      i = j
      continue
    }
    if (ch === '/' && rawText[i + 1] === '*') {
      let j = i + 2
      while (j < n && !(rawText[j] === '*' && rawText[j + 1] === '/')) j++
      j = Math.min(j + 2, n)
      tokens.push({ type: 'text', text: rawText.slice(i, j) })
      i = j
      continue
    }

    if (ch === '{') {
      tokens.push({ type: 'open-brace', text: '{' })
      i++
      continue
    }
    if (ch === '[') {
      tokens.push({ type: 'open-bracket', text: '[' })
      i++
      continue
    }
    if (ch === '}') {
      tokens.push({ type: 'close-brace', text: '}' })
      i++
      continue
    }
    if (ch === ']') {
      tokens.push({ type: 'close-bracket', text: ']' })
      i++
      continue
    }
    if (ch === ',') {
      tokens.push({ type: 'comma', text: ',' })
      i++
      continue
    }
    if (ch === ':') {
      tokens.push({ type: 'colon', text: ':' })
      i++
      continue
    }

    // Everything else -- numbers, bare/unquoted words, decorative punctuation runs, anything --
    // is carried through untouched as one chunk.
    {
      let j = i
      while (
        j < n &&
        !STRUCTURAL_CHARS.includes(rawText[j]!) &&
        !(rawText[j] === '/' && (rawText[j + 1] === '/' || rawText[j + 1] === '*'))
      ) {
        j++
      }
      if (j === i) j++
      tokens.push({ type: 'text', text: rawText.slice(i, j) })
      i = j
      continue
    }
  }

  return tokens
}

/**
 * Purely textual JSON "beautifier" for input that isn't expected to be valid: reflows
 * whitespace/indentation around structural punctuation (`{ } [ ] , :`) the way a JSON formatter
 * would, but never parses, validates, adds, or removes a single non-whitespace character --
 * missing closing brackets stay missing, an unterminated string stays unterminated, stray text
 * (a decorative separator line, leftover prose) is carried through on its own line untouched.
 * Always succeeds; there's no notion of failure since it never has to produce valid JSON.
 */
export function beautifyLoose(rawText: string, indentUnit = '  '): string {
  const tokens = tokenize(rawText)
  let out = ''
  let depth = 0

  for (let idx = 0; idx < tokens.length; idx++) {
    const tok = tokens[idx]!
    const prev = tokens[idx - 1]

    if (tok.type === 'close-brace' || tok.type === 'close-bracket') {
      depth = Math.max(depth - 1, 0)
    }

    if (idx === 0 || tok.type === 'comma' || tok.type === 'colon') {
      // Attaches straight to whatever came before -- no separator.
    } else if (prev?.type === 'colon') {
      // The value right after "key": -- a single space, never a trailing one if this were the
      // last token (there'd be no such token to attach a space in front of).
      if (indentUnit) out += ' '
    } else {
      out += '\n' + indentUnit.repeat(depth)
    }

    out += tok.text

    if (tok.type === 'open-brace' || tok.type === 'open-bracket') depth++
  }

  return out
}
