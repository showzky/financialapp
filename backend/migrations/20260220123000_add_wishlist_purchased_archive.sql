-- ADD THIS: purchased archive lifecycle for wishlist items
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

CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_status ON wishlist_items(user_id, status);
