import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 8080),
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: '1h',
  adminTelegramId: String(process.env.ADMIN_TELEGRAM_ID || '6067477588'),
  paymentMode: process.env.PAYMENT_MODE === 'real' ? 'real' : 'demo',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
};

if (!env.jwtSecret || !env.adminTelegramId) {
  throw new Error('Missing required environment variables');
}

if (env.paymentMode === 'real' && !env.telegramBotToken) {
  throw new Error('TELEGRAM_BOT_TOKEN is required in real payment mode');
}
