CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(100),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(190) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  amount NUMERIC(14,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  provider VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(120) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  prompt_tokens INT NOT NULL,
  completion_tokens INT NOT NULL,
  total_tokens INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  id BIGSERIAL PRIMARY KEY,
  key VARCHAR(128) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(64) NOT NULL,
  message TEXT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id BIGINT NOT NULL REFERENCES admins(id),
  action VARCHAR(64) NOT NULL,
  target_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_status_created ON users(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created ON ai_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_type_created ON logs(type, created_at DESC);
