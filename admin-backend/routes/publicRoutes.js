import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { addLessonPoints, createSubscriptionRequest, getLeaderboardData, getLoadingLogo } from '../services/coreService.js';
import { getOrCreateUser } from '../data/store.js';

export const publicRouter = Router();

publicRouter.post('/lesson/complete', [body('telegramId').isString().notEmpty(), body('points').isInt({ min: 1, max: 1000 })], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid payload' });

  const user = addLessonPoints({ telegramId: req.body.telegramId, points: Number(req.body.points) });
  return res.json({ success: true, user });
});

publicRouter.get('/leaderboard', [query('period').optional().isIn(['weekly', 'monthly', 'alltime']), query('limit').optional().isInt({ min: 1, max: 100 }), query('telegramId').optional().isString()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid query' });

  const data = getLeaderboardData({
    period: req.query.period || 'weekly',
    limit: Number(req.query.limit || 100),
    currentTelegramId: req.query.telegramId || null,
  });

  return res.json({ success: true, data });
});

publicRouter.post('/subscriptions', [body('telegramId').isString().notEmpty(), body('username').optional().isString(), body('planType').isIn(['7d', '1m', '1y']), body('proofImage').isString().notEmpty()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid payload' });

  try {
    getOrCreateUser(req.body.telegramId, req.body.username || '');
    const subscription = createSubscriptionRequest({
      telegramId: req.body.telegramId,
      username: req.body.username || '',
      planType: req.body.planType,
      proofImage: req.body.proofImage,
    });
    return res.json({ success: true, subscription, message: 'Your premium account will be activated soon after verification.' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || 'Unable to create subscription' });
  }
});

publicRouter.get('/users/me', [query('telegramId').isString().notEmpty()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'telegramId required' });

  const user = getOrCreateUser(req.query.telegramId);
  return res.json({ success: true, user });
});

publicRouter.get('/settings/loading-logo', (_req, res) => {
  const setting = getLoadingLogo();
  return res.json({ success: true, imageUrl: setting?.value || null });
});
