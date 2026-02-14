import { pool } from '../config/db.js';

export async function getAllSettings() {
  const { rows } = await pool.query('SELECT id, key, value, updated_at FROM system_settings ORDER BY key ASC');
  return rows;
}

export async function upsertSettings(entries, client = pool) {
  const updated = [];
  for (const entry of entries) {
    const { rows } = await client.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
       RETURNING id, key, value, updated_at`,
      [entry.key, entry.value]
    );
    updated.push(rows[0]);
  }
  return updated;
}
