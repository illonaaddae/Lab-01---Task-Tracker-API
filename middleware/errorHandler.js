/**
 * Global error handler. Reads err.statusCode (default 500) and returns a JSON envelope.
 * @param {Error & { statusCode?: number }} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, next) {
  const status = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${status} ${message}`);
  if (status === 500) {
    console.error(err.stack);
  }

  res.status(status).json({
    error: {
      message,
      status,
    },
  });
}

module.exports = errorHandler;
