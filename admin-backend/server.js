import express from 'express';
import { adminRouter } from './routes/adminRoutes.js';
import { paymentRouter } from './routes/paymentRoutes.js';
import { telegramRouter } from './routes/telegramRoutes.js';
import { env } from './config/env.js';

const app = express();

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ success: true, mode: env.paymentMode }));
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/telegram', telegramRouter);

app.use((_req, res) => {
  return res.status(404).json({ success: false, message: 'Not found' });
});

app.listen(env.port, () => {
  console.log(`Admin backend running on port ${env.port} in ${env.paymentMode} mode`);
});
