import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateAdminByTelegramId } from '../auth/adminAuthService.js';
import { verifyAdminToken } from '../middleware/verifyAdminToken.js';

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
