import { pool } from '../config/db.js';

export async function findAdminByEmail(email) {
  const { rows } = await pool.query('SELECT id, email, password_hash, role, created_at FROM admins WHERE email = $1 LIMIT 1', [email]);
  return rows[0] || null;
}

export async function addAdminLog(adminId, action, targetId = null, client = pool) {
  await client.query(
    'INSERT INTO admin_logs (admin_id, action, target_id, created_at) VALUES ($1, $2, $3, NOW())',
    [adminId, action, targetId]
  );
}
