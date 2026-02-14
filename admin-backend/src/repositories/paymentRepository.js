import { pool } from '../config/db.js';

export async function listPayments({ limit, offset, status }) {
  const values = [];
  let where = '';
  if (status) {
    values.push(status);
    where = `WHERE status = $1`;
  }
  values.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT id, user_id, amount, currency, status, provider, transaction_id, created_at
     FROM payments ${where} ORDER BY id DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return rows;
}

export async function getPaymentById(id, client = pool) {
  const { rows } = await client.query('SELECT * FROM payments WHERE id = $1 LIMIT 1', [id]);
  return rows[0] || null;
}

export async function setPaymentStatus(id, status, client = pool) {
  const { rows } = await client.query('UPDATE payments SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
  return rows[0] || null;
}
