import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { findAdminByEmail } from '../repositories/adminRepository.js';
import { AppError } from '../utils/http.js';

export async function adminLogin(email, password) {
  const admin = await findAdminByEmail(email);
  if (!admin) throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');

  const isMatch = await bcrypt.compare(password, admin.password_hash);
  if (!isMatch) throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');

  const token = jwt.sign(
    { sub: admin.id, email: admin.email, role: admin.role, tokenVersion: env.adminTokenVersion },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      createdAt: admin.created_at,
    },
  };
}
