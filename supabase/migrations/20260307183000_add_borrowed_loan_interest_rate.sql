ALTER TABLE borrowed_loans
ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (interest_rate >= 0 AND interest_rate <= 100);
