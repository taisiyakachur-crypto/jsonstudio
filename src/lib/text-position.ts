/** Converts a 0-based character offset into a 1-based {line, column}. */
export function offsetToLineColumn(text: string, offset: number): { line: number; column: number } {
  const clamped = Math.max(0, Math.min(offset, text.length))
  let line = 1
  let lastNewline = -1
  for (let i = 0; i < clamped; i++) {
    if (text[i] === '\n') {
      line++
      lastNewline = i
    }
  }
  return { line, column: clamped - lastNewline }
}

/** Converts a 1-based {line, column} into a 0-based character offset. */
export function lineColumnToOffset(text: string, line: number, column: number): number {
  let currentLine = 1
  let i = 0
  while (currentLine < line && i < text.length) {
    if (text[i] === '\n') currentLine++
    i++
  }
  return Math.min(i + Math.max(0, column - 1), text.length)
}
