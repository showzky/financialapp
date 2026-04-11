-- Change tracks_velocity column default to FALSE.
-- Existing rows keep their current value (TRUE from the initial migration).
-- New categories will default to not tracking velocity unless explicitly opted in.
ALTER TABLE budget_categories
  ALTER COLUMN tracks_velocity SET DEFAULT FALSE;
