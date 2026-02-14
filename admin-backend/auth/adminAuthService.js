import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function authenticateAdminByTelegramId(telegramId) {
  const normalizedTelegramId = String(telegramId || '');
  if (normalizedTelegramId !== env.adminTelegramId) {
    return null;
  }

  return jwt.sign(
    {
      sub: normalizedTelegramId,
      telegram_id: normalizedTelegramId,
      role: 'admin',
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}
