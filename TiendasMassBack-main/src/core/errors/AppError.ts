/**
 * Canonical application error.
 *
 * Carries an HTTP `statusCode` so the global error handler can translate a
 * thrown domain error into the right response. The legacy `ApiError`
 * (re-exported from `middlewares/errorHandler`) extends this class, so old and
 * new throw sites are handled uniformly.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    // Restore prototype chain when targeting ES5/ES2016 output.
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, new.target);
  }
}
