import { Router } from 'express';
import { login, logout } from '../controllers/authController.js';
import {
  banUserController,
  getUserController,
  listUsersController,
  patchUserController,
  unbanUserController,
} from '../controllers/usersController.js';
import {
  listPaymentsController,
  refundPaymentController,
  verifyPaymentController,
} from '../controllers/paymentsController.js';
import {
  adminLogsController,
  aiUsageByUserController,
  aiUsageController,
  logsController,
} from '../controllers/metricsController.js';
import { getSettingsController, patchSettingsController } from '../controllers/settingsController.js';
import { requireAdminAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  adminLoginSchema,
  idParamSchema,
  logsQuerySchema,
  paginationSchema,
  paymentsQuerySchema,
  settingsPatchSchema,
  userIdParamSchema,
  userPatchSchema,
  usersQuerySchema,
} from '../types/schemas.js';

export const adminRouter = Router();

adminRouter.post('/login', validate(adminLoginSchema), login);
adminRouter.post('/logout', requireAdminAuth, logout);

adminRouter.use(requireAdminAuth);

adminRouter.get('/users', validate(usersQuerySchema, 'query'), listUsersController);
adminRouter.get('/users/:id', validate(idParamSchema, 'params'), getUserController);
adminRouter.patch('/users/:id', requireRole('owner', 'super_admin'), validate(idParamSchema, 'params'), validate(userPatchSchema), patchUserController);
adminRouter.post('/users/:id/ban', requireRole('owner', 'super_admin', 'moderator'), validate(idParamSchema, 'params'), banUserController);
adminRouter.post('/users/:id/unban', requireRole('owner', 'super_admin', 'moderator'), validate(idParamSchema, 'params'), unbanUserController);

adminRouter.get('/payments', validate(paymentsQuerySchema, 'query'), listPaymentsController);
adminRouter.post('/payments/:id/verify', requireRole('owner', 'super_admin', 'finance'), validate(idParamSchema, 'params'), verifyPaymentController);
adminRouter.post('/payments/:id/refund', requireRole('owner', 'super_admin', 'finance'), validate(idParamSchema, 'params'), refundPaymentController);

adminRouter.get('/ai-usage', validate(paginationSchema, 'query'), aiUsageController);
adminRouter.get('/ai-usage/:userId', validate(userIdParamSchema, 'params'), validate(paginationSchema, 'query'), aiUsageByUserController);

adminRouter.get('/settings', requireRole('owner', 'super_admin'), getSettingsController);
adminRouter.patch('/settings', requireRole('owner', 'super_admin'), validate(settingsPatchSchema), patchSettingsController);

adminRouter.get('/logs', validate(logsQuerySchema, 'query'), logsController);
adminRouter.get('/admin-logs', validate(paginationSchema, 'query'), adminLogsController);
