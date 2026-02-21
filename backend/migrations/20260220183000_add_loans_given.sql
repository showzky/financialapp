CREATE TABLE IF NOT EXISTS loans_given (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  date_given DATE NOT NULL,
  expected_repayment_date DATE NOT NULL,
  repaid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expected_repayment_date >= date_given)
);

CREATE INDEX IF NOT EXISTS idx_loans_given_user_id ON loans_given(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_given_user_repaid_expected ON loans_given(user_id, repaid_at, expected_repayment_date);

ALTER TABLE loans_given
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
