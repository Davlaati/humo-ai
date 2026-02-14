import { AppError } from '../utils/http.js';

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ success: false, error: { code: err.code, message: err.message } });
  }

  console.error('Unhandled error', { path: req.path, err });
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unexpected server error' },
  });
}
