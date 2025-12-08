-- Fix: Ensure 'config' and 'account_id' columns exist on 'forms'
-- Description: Adds missing columns if they don't exist and reloads schema cache to fix PGRST204 errors
-- Date: 2025-12-08

DO $$
BEGIN
    -- 1. Ensure 'config' column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'forms' 
        AND column_name = 'config'
    ) THEN
        ALTER TABLE forms ADD COLUMN config JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;

    -- 2. Ensure 'account_id' column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'forms' 
        AND column_name = 'account_id'
    ) THEN
        ALTER TABLE forms ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_forms_account_id ON forms(account_id);
    END IF;
END $$;

-- 3. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
