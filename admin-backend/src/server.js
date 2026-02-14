import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

async function start() {
  try {
    await pool.query('SELECT 1');
    app.listen(env.port, () => {
      console.log(`Admin backend listening on :${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start app', error);
    process.exit(1);
  }
}

start();
