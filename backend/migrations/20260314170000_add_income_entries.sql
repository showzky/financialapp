CREATE TABLE IF NOT EXISTS income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  received_at TIMESTAMPTZ NOT NULL,
  account_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_income_entries_user_received_at
  ON income_entries(user_id, received_at DESC);
