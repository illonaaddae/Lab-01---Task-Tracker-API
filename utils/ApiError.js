/**
 * Error class that carries an HTTP status code.
 * Throw inside controllers; the global error handler reads statusCode.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status (e.g. 400, 404, 500)
   * @param {string} message    User-facing error message
   */
  constructor(statusCode, message) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
