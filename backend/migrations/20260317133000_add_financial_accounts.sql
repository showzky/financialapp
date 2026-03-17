CREATE TABLE IF NOT EXISTS account_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES account_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('credit', 'balance')),
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  credit_limit NUMERIC(12, 2),
  payment_day_of_month INTEGER CHECK (payment_day_of_month BETWEEN 1 AND 31),
  reminder JSONB NOT NULL DEFAULT '{"type":"none"}'::jsonb,
  icon_kind TEXT CHECK (icon_kind IN ('preset', 'company', 'image')),
  icon_label TEXT,
  icon_image_url TEXT,
  icon_company_query TEXT,
  account_type TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#4C89E8',
  notes TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_balance_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  amount_delta NUMERIC(12, 2) NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE income_entries
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES financial_accounts(id) ON DELETE SET NULL;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES financial_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_account_categories_user_sort
  ON account_categories(user_id, sort_order, created_at);

CREATE INDEX IF NOT EXISTS idx_financial_accounts_user_category_sort
  ON financial_accounts(user_id, category_id, sort_order, created_at);

CREATE INDEX IF NOT EXISTS idx_account_balance_adjustments_account_created_at
  ON account_balance_adjustments(account_id, created_at DESC);
