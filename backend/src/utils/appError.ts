// ADD THIS: application error type for consistent error responses
export class AppError extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}
