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