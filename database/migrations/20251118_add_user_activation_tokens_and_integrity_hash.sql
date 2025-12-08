-- ============================================
-- Migration: Add User Activation Tokens & Contract Integrity Hash
-- Date: 2025-11-18
-- ============================================

-- 1) Add integrity_hash to contracts (for SHA-256 of encrypted bundle)
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS integrity_hash TEXT;

COMMENT ON COLUMN contracts.integrity_hash IS 'SHA-256 hash of the full encrypted contract bundle (PDF, IDs, signature events) for integrity verification';

-- 2) Create user_activation_tokens table
CREATE TABLE IF NOT EXISTS user_activation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_activation_tokens IS 'Stores hashed activation tokens for new/pending users to set their password via secure link';
COMMENT ON COLUMN user_activation_tokens.user_id IS 'References the application user that this activation token belongs to';
COMMENT ON COLUMN user_activation_tokens.token_hash IS 'SHA-256 hash of the raw activation token; the raw token is never stored';
COMMENT ON COLUMN user_activation_tokens.expires_at IS 'Token expiration timestamp; usually 24 hours after creation';
COMMENT ON COLUMN user_activation_tokens.used_at IS 'When the token was consumed; ensures single-use activation';

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_user_activation_tokens_user_id ON user_activation_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activation_tokens_token_hash ON user_activation_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_activation_tokens_expires_at ON user_activation_tokens(expires_at);
