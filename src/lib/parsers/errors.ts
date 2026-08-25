/** Thrown by a parser with a message meant to be shown to the user as-is. */
export class ParseInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParseInputError'
  }
}
