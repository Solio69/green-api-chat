export class ReceiverError extends Error {
  readonly code: string
  readonly retryAfterMs: number
  constructor({
    code,
    retryAfterMs = 0,
  }: {
    code: string
    retryAfterMs?: number
  }) {
    super(code)
    this.code = code
    this.retryAfterMs = retryAfterMs
  }
}
