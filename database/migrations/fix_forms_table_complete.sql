-- Mega Fix: Ensure ALL columns exist on 'forms' and reload schema
-- Description: Comprehensive check for all required columns to stop the PGRST204 errors once and for all.
-- Date: 2025-12-08

DO $$
BEGIN
    -- 1. Ensure 'title' column exists (it should, but just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forms' AND column_name = 'title') THEN
        ALTER TABLE forms ADD COLUMN title TEXT NOT NULL DEFAULT 'Untitled Form';
    END IF;

    -- 2. Ensure 'form_key' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forms' AND column_name = 'form_key') THEN
        ALTER TABLE forms ADD COLUMN form_key TEXT NOT NULL DEFAULT md5(random()::text);
    END IF;

    -- 3. Ensure 'description' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forms' AND column_name = 'description') THEN
        ALTER TABLE forms ADD COLUMN description TEXT;
    END IF;

    -- 4. Ensure 'config' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forms' AND column_name = 'config') THEN
        ALTER TABLE forms ADD COLUMN config JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;

    -- 5. Ensure 'account_id' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forms' AND column_name = 'account_id') THEN
        ALTER TABLE forms ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_forms_account_id ON forms(account_id);
    END IF;

    -- 6. Ensure 'created_at' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forms' AND column_name = 'created_at') THEN
        ALTER TABLE forms ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;

END $$;

-- 7. Force PostgREST schema cache reload (CRITICAL)
NOTIFY pgrst, 'reload schema';
