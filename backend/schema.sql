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
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'purchased')),
  purchased_at TIMESTAMPTZ,
  purchased_amount NUMERIC(12, 2) CHECK (purchased_amount IS NULL OR purchased_amount >= 0),
  metadata_status TEXT NOT NULL DEFAULT 'unknown' CHECK (metadata_status IN ('fresh', 'stale', 'unknown')),
  metadata_last_checked_at TIMESTAMPTZ,
  metadata_last_success_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlist_price_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_item_id UUID NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

ALTER TABLE wishlist_items
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE wishlist_items
ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMPTZ;

ALTER TABLE wishlist_items
ADD COLUMN IF NOT EXISTS purchased_amount NUMERIC(12, 2);

UPDATE wishlist_items
SET status = 'active'
WHERE status IS NULL OR status = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wishlist_items_status_check'
  ) THEN
    ALTER TABLE wishlist_items
    ADD CONSTRAINT wishlist_items_status_check
    CHECK (status IN ('active', 'purchased'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wishlist_items_purchased_amount_check'
  ) THEN
    ALTER TABLE wishlist_items
    ADD CONSTRAINT wishlist_items_purchased_amount_check
    CHECK (purchased_amount IS NULL OR purchased_amount >= 0);
  END IF;
END $$;

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
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_status ON wishlist_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_normalized_url ON wishlist_items(user_id, normalized_url);
CREATE INDEX IF NOT EXISTS idx_wishlist_price_snapshots_item_id ON wishlist_price_snapshots(wishlist_item_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishlist_price_snapshots_user_id ON wishlist_price_snapshots(user_id);

INSERT INTO wishlist_price_snapshots (wishlist_item_id, user_id, price, captured_at)
SELECT
  item.id,
  item.user_id,
  item.price,
  COALESCE(item.metadata_last_success_at, item.updated_at, item.created_at, NOW())
FROM wishlist_items item
WHERE item.price IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM wishlist_price_snapshots snapshot
    WHERE snapshot.wishlist_item_id = item.id
  );
