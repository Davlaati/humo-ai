import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateAdmin } from '../auth/adminAuthService.js';
import { verifyAdminToken } from '../middleware/verifyAdminToken.js';

export const adminRouter = Router();

adminRouter.post(
  '/login',
  [body('login').isString().notEmpty(), body('password').isString().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Invalid request payload' });
    }

    const { login, password } = req.body;
    const token = await authenticateAdmin(login, password);

    if (!token) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    return res.json({ success: true, token });
  }
);

adminRouter.use(verifyAdminToken);

adminRouter.get('/me', (_req, res) => {
  return res.json({ success: true });
});
