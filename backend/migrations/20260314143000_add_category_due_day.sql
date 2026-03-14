ALTER TABLE budget_categories
ADD COLUMN IF NOT EXISTS due_day_of_month INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'budget_categories_due_day_of_month_check'
  ) THEN
    ALTER TABLE budget_categories
    ADD CONSTRAINT budget_categories_due_day_of_month_check
    CHECK (due_day_of_month BETWEEN 1 AND 31);
  END IF;
END $$;
