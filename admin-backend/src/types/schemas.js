import { z } from 'zod';

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  otp: z.string().length(6).optional(),
});

export const usersQuerySchema = paginationSchema.extend({
  status: z.enum(['active', 'blocked']).optional(),
  role: z.enum(['user', 'moderator', 'vip']).optional(),
});

export const userPatchSchema = z.object({
  username: z.string().min(1).max(100).optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().max(100).optional(),
  role: z.enum(['user', 'moderator', 'vip']).optional(),
  is_premium: z.boolean().optional(),
});

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const userIdParamSchema = z.object({ userId: z.coerce.number().int().positive() });

export const paymentsQuerySchema = paginationSchema.extend({
  status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
});

export const logsQuerySchema = paginationSchema.extend({
  type: z.string().min(1).max(64).optional(),
});

export const settingsPatchSchema = z.object({
  items: z.array(z.object({ key: z.string().min(1).max(128), value: z.string().max(1000) })).min(1),
});
