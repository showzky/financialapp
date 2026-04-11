-- Reset tracks_velocity to FALSE for all existing categories.
-- The initial migration (20260411120000) added this column with DEFAULT TRUE,
-- giving every existing row a value of TRUE. This migration opts them all out
-- so the feature behaves as opt-in, matching the new default of FALSE.
UPDATE budget_categories SET tracks_velocity = FALSE;
