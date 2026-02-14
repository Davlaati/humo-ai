-- Production-ready schema reference for leaderboard + premium subscriptions
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(100),
  points_total INTEGER NOT NULL DEFAULT 0,
  points_weekly INTEGER NOT NULL DEFAULT 0,
  points_monthly INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  premium_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type VARCHAR(8) NOT NULL CHECK (plan_type IN ('7d', '1m', '1y')),
  price INTEGER NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  proof_image TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id BIGSERIAL PRIMARY KEY,
  key VARCHAR(128) UNIQUE NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
  telegram_payment_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id BIGINT NOT NULL,
  action VARCHAR(128) NOT NULL,
  target_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
