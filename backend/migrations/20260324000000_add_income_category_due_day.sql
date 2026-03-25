ALTER TABLE income_categories
  ADD COLUMN IF NOT EXISTS due_day_of_month INTEGER
    CHECK (due_day_of_month >= 1 AND due_day_of_month <= 31);
