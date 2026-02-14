import { adminLogin } from '../services/authService.js';
import { ok } from '../utils/http.js';

export async function login(req, res, next) {
  try {
    const result = await adminLogin(req.body.email, req.body.password);
    return ok(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res) {
  return ok(res, { message: 'Logged out. Rotate ADMIN_TOKEN_VERSION to revoke all active tokens.' });
}
