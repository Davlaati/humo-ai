import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateAdminByTelegramId } from '../auth/adminAuthService.js';
import { verifyAdminToken } from '../middleware/verifyAdminToken.js';
import { getAdminData, manualVerifyPayment } from '../services/paymentService.js';

export const adminRouter = Router();

adminRouter.post('/login', [body('telegramId').isString().notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Invalid request payload' });
  }

  const { telegramId } = req.body;
  const token = authenticateAdminByTelegramId(telegramId);

  if (!token) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  return res.json({ success: true, token, expiresIn: '1h' });
});

adminRouter.use(verifyAdminToken);

adminRouter.get('/me', (req, res) => {
  return res.json({
    success: true,
    admin: {
      telegramId: req.admin.telegram_id,
      role: req.admin.role,
    },
  });
});

adminRouter.get('/users', (_req, res) => {
  const { users } = getAdminData();
  return res.json({ success: true, users });
});

adminRouter.get('/payments', (_req, res) => {
  const { payments } = getAdminData();
  return res.json({ success: true, payments });
});

adminRouter.get('/stats', (_req, res) => {
  const { stats } = getAdminData();
  return res.json({ success: true, stats });
});

adminRouter.get('/logs', (_req, res) => {
  const { logs } = getAdminData();
  return res.json({ success: true, logs });
});

adminRouter.post('/payments/:id/verify', [param('id').isInt({ min: 1 })], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid payment id' });

  try {
    const payment = manualVerifyPayment(Number(req.params.id), req.admin.telegram_id);
    return res.json({ success: true, payment });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message || 'Payment not found' });
  }
});
