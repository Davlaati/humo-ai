import { pool } from '../config/db.js';

export async function listAiUsage({ limit, offset, userId }) {
  const values = [];
  let where = '';
  if (userId) {
    values.push(userId);
    where = 'WHERE user_id = $1';
  }
  values.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT id, user_id, prompt_tokens, completion_tokens, total_tokens, created_at,
            CASE WHEN total_tokens > 100000 THEN true ELSE false END AS warning_flag
     FROM ai_usage ${where}
     ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return rows;
}

export async function listSystemLogs({ limit, offset, type }) {
  const values = [];
  let where = '';
  if (type) {
    values.push(type);
    where = 'WHERE type = $1';
  }
  values.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT id, type, message, metadata_json, created_at
     FROM logs ${where} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return rows;
}

export async function listAdminLogs({ limit, offset }) {
  const { rows } = await pool.query(
    `SELECT al.id, al.admin_id, a.email AS admin_email, al.action, al.target_id, al.created_at
     FROM admin_logs al
     JOIN admins a ON a.id = al.admin_id
     ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

export async function addSystemLog(type, message, metadata = {}, client = pool) {
  await client.query(
    'INSERT INTO logs (type, message, metadata_json, created_at) VALUES ($1, $2, $3::jsonb, NOW())',
    [type, message, JSON.stringify(metadata)]
  );
}
