CREATE TABLE IF NOT EXISTS push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_notification_tokens_user_id
  ON push_notification_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_push_notification_tokens_user_updated_at
  ON push_notification_tokens(user_id, updated_at DESC);