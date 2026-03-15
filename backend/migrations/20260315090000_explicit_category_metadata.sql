ALTER TABLE budget_categories
ADD COLUMN IF NOT EXISTS parent_name TEXT NOT NULL DEFAULT 'Other';

ALTER TABLE budget_categories
ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT 'ellipsis-horizontal';

ALTER TABLE budget_categories
ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#1f2a3d';

ALTER TABLE budget_categories
ADD COLUMN IF NOT EXISTS icon_color TEXT NOT NULL DEFAULT '#d8d8e6';

ALTER TABLE budget_categories
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE budget_categories
ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE budget_categories
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS income_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  icon_color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

ALTER TABLE income_entries
ADD COLUMN IF NOT EXISTS income_category_id UUID REFERENCES income_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_budget_categories_user_sort
  ON budget_categories(user_id, sort_order, created_at);

CREATE INDEX IF NOT EXISTS idx_income_categories_user_sort
  ON income_categories(user_id, sort_order, created_at);

CREATE INDEX IF NOT EXISTS idx_income_entries_income_category_id
  ON income_entries(income_category_id);
