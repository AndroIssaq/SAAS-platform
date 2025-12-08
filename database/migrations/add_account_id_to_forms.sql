-- Migration: Add account_id to forms
-- Description: Links forms to accounts for multi-tenancy support
-- Date: 2025-12-08

ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_forms_account_id ON forms(account_id);

-- Update RLS policies to check for account membership
-- (Optional but recommended - keeping existing admin policy for now to avoid breaking changes, 
-- but adding account-owner access would be the next step)
