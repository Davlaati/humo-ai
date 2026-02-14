import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export async function authenticateAdmin(login, password) {
  if (login !== env.adminLogin) {
    return null;
  }

  const validPassword = await bcrypt.compare(password, env.adminPasswordHash);
  if (!validPassword) {
    return null;
  }

  return jwt.sign({ sub: login, role: 'admin' }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}
