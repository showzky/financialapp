-- Vacation Funds Table
CREATE TABLE IF NOT EXISTS vacation_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount BIGINT NOT NULL DEFAULT 0, -- amount in cents
  current_amount BIGINT NOT NULL DEFAULT 0, -- amount in cents
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vacation Expense Categories ENUM
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vacation_expense_category') THEN
    CREATE TYPE vacation_expense_category AS ENUM ('flights', 'food', 'hotel', 'miscellaneous');
  END IF;
END $$;

-- Vacation Expenses Table
CREATE TABLE IF NOT EXISTS vacation_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacation_id UUID NOT NULL REFERENCES vacation_funds(id) ON DELETE CASCADE,
  category vacation_expense_category NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0, -- amount in cents
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add is_vacation to loans_given
ALTER TABLE loans_given ADD COLUMN IF NOT EXISTS is_vacation BOOLEAN NOT NULL DEFAULT false;
