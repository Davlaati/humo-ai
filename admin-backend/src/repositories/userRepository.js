import { pool } from '../config/db.js';

export async function listUsers({ limit, offset, status, role }) {
  const filters = [];
  const values = [];
  if (status) {
    values.push(status);
    filters.push(`status = $${values.length}`);
  }
  if (role) {
    values.push(role);
    filters.push(`role = $${values.length}`);
  }
  values.push(limit, offset);
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const sql = `SELECT id, telegram_id, username, first_name, last_name, role, status, balance, is_premium, created_at
               FROM users ${where} ORDER BY id DESC LIMIT $${values.length - 1} OFFSET $${values.length}`;
  const { rows } = await pool.query(sql, values);
  return rows;
}

export async function getUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return rows[0] || null;
}

export async function patchUser(id, patch) {
  const columns = Object.keys(patch);
  if (!columns.length) return getUserById(id);

  const values = columns.map((k) => patch[k]);
  const setSql = columns.map((k, idx) => `${k} = $${idx + 1}`).join(', ');
  values.push(id);
  const { rows } = await pool.query(`UPDATE users SET ${setSql} WHERE id = $${values.length} RETURNING *`, values);
  return rows[0] || null;
}

export async function updateUserStatus(id, status, client = pool) {
  const { rows } = await client.query('UPDATE users SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
  return rows[0] || null;
}

export async function incrementUserBalance(id, amount, client = pool) {
  const { rows } = await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING *', [amount, id]);
  return rows[0] || null;
}
