-- ADD THIS: PostgreSQL schema for finance backend
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  monthly_income NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_income >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('budget', 'fixed')),
  allocated NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (allocated >= 0),
  spent NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (spent >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  note TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL DEFAULT '',
  price NUMERIC(12, 2) CHECK (price IS NULL OR price >= 0),
  image_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  saved_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (saved_amount >= 0),
  metadata_status TEXT NOT NULL DEFAULT 'unknown' CHECK (metadata_status IN ('fresh', 'stale', 'unknown')),
  metadata_last_checked_at TIMESTAMPTZ,
  metadata_last_success_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE wishlist_items
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'Medium';

UPDATE wishlist_items
SET priority = 'Medium'
WHERE priority IS NULL OR priority = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wishlist_items_priority_check'
  ) THEN
    ALTER TABLE wishlist_items
    ADD CONSTRAINT wishlist_items_priority_check
    CHECK (priority IN ('High', 'Medium', 'Low'));
  END IF;
END $$;

ALTER TABLE wishlist_items
ADD COLUMN IF NOT EXISTS normalized_url TEXT NOT NULL DEFAULT '';

ALTER TABLE wishlist_items
ADD COLUMN IF NOT EXISTS metadata_status TEXT NOT NULL DEFAULT 'unknown';

ALTER TABLE wishlist_items
ADD COLUMN IF NOT EXISTS metadata_last_checked_at TIMESTAMPTZ;

ALTER TABLE wishlist_items
ADD COLUMN IF NOT EXISTS metadata_last_success_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wishlist_items_metadata_status_check'
  ) THEN
    ALTER TABLE wishlist_items
    ADD CONSTRAINT wishlist_items_metadata_status_check
    CHECK (metadata_status IN ('fresh', 'stale', 'unknown'));
  END IF;
END $$;

UPDATE wishlist_items
SET normalized_url = url
WHERE normalized_url IS NULL OR normalized_url = '';

CREATE INDEX IF NOT EXISTS idx_budget_categories_user_id ON budget_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_normalized_url ON wishlist_items(user_id, normalized_url);
