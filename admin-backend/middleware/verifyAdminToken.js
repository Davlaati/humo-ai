import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (String(payload.telegram_id) !== env.adminTelegramId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}
