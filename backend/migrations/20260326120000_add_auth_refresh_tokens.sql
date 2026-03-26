CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  replaced_by_token_hash TEXT REFERENCES auth_refresh_tokens(token_hash) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_user_id
ON auth_refresh_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_expires_at
ON auth_refresh_tokens (expires_at);