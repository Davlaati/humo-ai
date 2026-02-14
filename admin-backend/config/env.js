import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 8080),
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: '1h',
  adminTelegramId: String(process.env.ADMIN_TELEGRAM_ID || '6067477588'),
};

if (!env.jwtSecret || !env.adminTelegramId) {
  throw new Error('Missing required environment variables');
}
