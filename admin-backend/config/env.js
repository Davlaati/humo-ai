import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 8080),
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: '15m',
  adminLogin: process.env.ADMIN_LOGIN || '',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
};

if (!env.jwtSecret || !env.adminLogin || !env.adminPasswordHash) {
  throw new Error('Missing required environment variables');
}
