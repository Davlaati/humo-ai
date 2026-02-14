import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateAdminByTelegramId } from '../auth/adminAuthService.js';
import { verifyAdminToken } from '../middleware/verifyAdminToken.js';
import { getAdminData, manualVerifyPayment } from '../services/paymentService.js';
import { approveSubscription, listPendingSubscriptions, rejectSubscription, resetWeeklyLeaderboardByAdmin, setLoadingLogo } from '../services/coreService.js';

export const adminRouter = Router();

adminRouter.post('/login', [body('telegramId').isString().notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid request payload' });

  const token = authenticateAdminByTelegramId(req.body.telegramId);
  if (!token) return res.status(403).json({ success: false, message: 'Forbidden' });

  return res.json({ success: true, token, expiresIn: '1h' });
});

adminRouter.use(verifyAdminToken);

adminRouter.get('/me', (req, res) => res.json({ success: true, admin: { telegramId: req.admin.telegram_id, role: req.admin.role } }));
adminRouter.get('/users', (_req, res) => res.json({ success: true, users: getAdminData().users }));
adminRouter.get('/payments', (_req, res) => res.json({ success: true, payments: getAdminData().payments }));
adminRouter.get('/stats', (_req, res) => res.json({ success: true, stats: getAdminData().stats }));
adminRouter.get('/logs', (_req, res) => res.json({ success: true, logs: getAdminData().logs }));

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

adminRouter.get('/subscriptions/pending', (_req, res) => {
  return res.json({ success: true, subscriptions: listPendingSubscriptions() });
});

adminRouter.post('/subscriptions/:id/approve', [param('id').isInt({ min: 1 })], (req, res) => {
  try {
    const sub = approveSubscription({ subscriptionId: Number(req.params.id), adminId: req.admin.telegram_id });
    return res.json({ success: true, subscription: sub });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message || 'Subscription not found' });
  }
});

adminRouter.post('/subscriptions/:id/reject', [param('id').isInt({ min: 1 })], (req, res) => {
  try {
    const sub = rejectSubscription({ subscriptionId: Number(req.params.id), adminId: req.admin.telegram_id });
    return res.json({ success: true, subscription: sub });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message || 'Subscription not found' });
  }
});

adminRouter.post('/leaderboard/reset-weekly', (_req, res) => {
  resetWeeklyLeaderboardByAdmin({ adminId: _req.admin.telegram_id });
  return res.json({ success: true });
});

adminRouter.post('/settings/loading-logo', [body('imageUrl').isString().notEmpty()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'imageUrl required' });

  const row = setLoadingLogo({ imageUrl: req.body.imageUrl, adminId: req.admin.telegram_id });
  return res.json({ success: true, setting: row });
});
