import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { env } from '../config/env.js';
import { createInvoice, getUserBalance, simulateSuccess } from '../services/paymentService.js';

export const paymentRouter = Router();

paymentRouter.post(
  '/create-invoice',
  [body('telegramId').isString().notEmpty(), body('packageKey').isString().notEmpty(), body('username').optional().isString()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid request payload' });

    try {
      const invoice = await createInvoice({
        telegramId: req.body.telegramId,
        username: req.body.username || '',
        packKey: req.body.packageKey,
      });
      return res.json({ success: true, ...invoice });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message || 'Unable to create invoice' });
    }
  }
);

paymentRouter.get('/balance/:telegramId', (req, res) => {
  const result = getUserBalance(req.params.telegramId);
  return res.json({ success: true, ...result });
});

paymentRouter.post('/simulate-success', [body('paymentId').isInt({ min: 1 })], (req, res) => {
  if (env.paymentMode !== 'demo') return res.status(403).json({ success: false, message: 'Simulation disabled in real mode' });

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid request payload' });

  try {
    const payment = simulateSuccess({ paymentId: Number(req.body.paymentId) });
    return res.json({ success: true, payment });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message || 'Payment not found' });
  }
});

