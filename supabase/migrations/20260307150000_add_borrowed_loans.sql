CREATE TABLE IF NOT EXISTS borrowed_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lender TEXT NOT NULL,
  original_amount NUMERIC(12, 2) NOT NULL CHECK (original_amount > 0),
  current_balance NUMERIC(12, 2) NOT NULL CHECK (current_balance >= 0),
  payoff_date DATE NOT NULL,
  notes TEXT,
  paid_off_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (current_balance <= original_amount)
);

CREATE INDEX IF NOT EXISTS idx_borrowed_loans_user_id ON borrowed_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_borrowed_loans_user_paid_off_payoff ON borrowed_loans(user_id, paid_off_at, payoff_date);

ALTER TABLE borrowed_loans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'borrowed_loans'
      AND policyname = 'borrowed_loans_select_own'
  ) THEN
    CREATE POLICY borrowed_loans_select_own
    ON borrowed_loans
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'borrowed_loans'
      AND policyname = 'borrowed_loans_insert_own'
  ) THEN
    CREATE POLICY borrowed_loans_insert_own
    ON borrowed_loans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'borrowed_loans'
      AND policyname = 'borrowed_loans_update_own'
  ) THEN
    CREATE POLICY borrowed_loans_update_own
    ON borrowed_loans
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'borrowed_loans'
      AND policyname = 'borrowed_loans_delete_own'
  ) THEN
    CREATE POLICY borrowed_loans_delete_own
    ON borrowed_loans
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;