import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateAdminByTelegramId } from '../auth/adminAuthService.js';
import { verifyAdminToken } from '../middleware/verifyAdminToken.js';
import { getAdminData, manualVerifyPayment } from '../services/paymentService.js';
import { createSubscription, listLeaderboard, listSubscriptions, resetWeeklyLeaderboard, reviewSubscription, setAppSetting } from '../data/store.js';

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

adminRouter.get('/leaderboard/top', [query('period').optional().isIn(['weekly', 'monthly', 'alltime'])], (req, res) => {
  const period = req.query.period || 'weekly';
  return res.json({ success: true, users: listLeaderboard(period, 100) });
});

adminRouter.post('/leaderboard/reset-weekly', (_req, res) => {
  resetWeeklyLeaderboard();
  return res.json({ success: true });
});

adminRouter.get('/subscriptions', [query('status').optional().isIn(['pending', 'approved', 'rejected'])], (req, res) => {
  const status = req.query.status || null;
  return res.json({ success: true, subscriptions: listSubscriptions(status) });
});

adminRouter.post('/subscriptions', [body('userId').isInt(), body('planType').isIn(['7d', '1m', '1y']), body('price').isInt(), body('proofImage').isString()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid payload' });
  const sub = createSubscription(req.body);
  return res.json({ success: true, subscription: sub });
});

adminRouter.post('/subscriptions/:id/review', [param('id').isInt(), body('status').isIn(['approved', 'rejected'])], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid payload' });
  const reviewed = reviewSubscription(req.params.id, req.body.status);
  if (!reviewed) return res.status(404).json({ success: false, message: 'Not found' });
  return res.json({ success: true, subscription: reviewed });
});

adminRouter.post('/app-settings', [body('key').isString(), body('value').isString()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid payload' });
  setAppSetting(req.body.key, req.body.value);
  return res.json({ success: true });
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
