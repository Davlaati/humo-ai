-- users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  telegram_id TEXT UNIQUE,
  username TEXT,
  points_total INT NOT NULL DEFAULT 0,
  points_weekly INT NOT NULL DEFAULT 0,
  points_monthly INT NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  premium_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('7d','1m','1y')),
  price INT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')),
  proof_image TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- app settings table
CREATE TABLE app_settings (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL
);
