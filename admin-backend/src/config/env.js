import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 8080),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  adminTokenVersion: Number(process.env.ADMIN_TOKEN_VERSION || 1),
};

if (!env.databaseUrl || !env.jwtSecret) {
  throw new Error('Missing required env values: DATABASE_URL, JWT_SECRET');
}
