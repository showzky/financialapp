CREATE TABLE IF NOT EXISTS monthly_budget_category_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  allocated NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (allocated >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category_id, month_start)
);

CREATE INDEX IF NOT EXISTS idx_monthly_budget_category_assignments_user_month
  ON monthly_budget_category_assignments(user_id, month_start);
