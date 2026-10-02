export class SessionQueryError extends Error {
  public readonly code: string
  public readonly status: number | null
  constructor({ code, status }: { code: string; status: number | null }) {
    super(code)
    this.code = code
    this.status = status
  }
}
