import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/http.js';

export function requireAdminAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Missing bearer token', 'UNAUTHORIZED'));
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload.tokenVersion !== env.adminTokenVersion) {
      throw new AppError(401, 'Token version mismatch', 'TOKEN_REVOKED');
    }
    req.admin = payload;
    return next();
  } catch (error) {
    return next(error instanceof AppError ? error : new AppError(401, 'Invalid token', 'UNAUTHORIZED'));
  }
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.admin || !roles.includes(req.admin.role)) {
    return next(new AppError(403, 'Forbidden', 'FORBIDDEN'));
  }
  return next();
};
