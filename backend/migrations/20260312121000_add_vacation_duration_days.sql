ALTER TABLE vacation_funds
ADD COLUMN IF NOT EXISTS duration_days INT;

ALTER TABLE vacation_funds
DROP CONSTRAINT IF EXISTS vacation_funds_duration_days_positive;

ALTER TABLE vacation_funds
ADD CONSTRAINT vacation_funds_duration_days_positive
CHECK (duration_days IS NULL OR duration_days > 0);