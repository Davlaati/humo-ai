import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { adminRouter } from './routes/adminRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const app = express();

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));
app.use('/admin', adminRouter);
app.use(errorHandler);
