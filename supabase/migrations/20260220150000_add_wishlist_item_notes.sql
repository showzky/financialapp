-- Add notes column to wishlist_items so supabase db push sees this change
ALTER TABLE wishlist_items
ADD COLUMN IF NOT EXISTS notes TEXT;
