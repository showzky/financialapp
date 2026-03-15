DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'budget_categories'
      AND column_name = 'group_id'
  ) THEN
    ALTER TABLE budget_categories
    ALTER COLUMN group_id DROP NOT NULL;
  END IF;
END $$;
