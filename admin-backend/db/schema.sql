-- PostgreSQL / SQLite starter schema
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT,
  balance_stars INTEGER NOT NULL DEFAULT 0,
  points_total INTEGER NOT NULL DEFAULT 0,
  points_weekly INTEGER NOT NULL DEFAULT 0,
  points_monthly INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT 0,
  premium_until TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
  telegram_payment_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('7d', '1m', '1y')),
  price INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  proof_image TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id INTEGER PRIMARY KEY,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  created_at TEXT NOT NULL
);
