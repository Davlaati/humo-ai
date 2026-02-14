import { Router } from 'express';
import { env } from '../config/env.js';
import { handleTelegramWebhook } from '../services/paymentService.js';

export const telegramRouter = Router();

telegramRouter.post('/webhook', async (req, res) => {
  if (env.telegramWebhookSecret) {
    const provided = req.headers['x-telegram-bot-api-secret-token'];
    if (provided !== env.telegramWebhookSecret) {
      return res.status(401).json({ success: false, message: 'Unauthorized webhook' });
    }
  }

  try {
    const result = await handleTelegramWebhook(req.body);
    return res.json({ success: true, result });
  } catch {
    return res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});
