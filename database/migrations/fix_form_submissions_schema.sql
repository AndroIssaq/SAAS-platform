-- Fix: Ensure form_submissions table has all required columns
-- Description: Makes sure form_submissions has all the columns the app expects
-- Date: 2025-12-08

DO $$
BEGIN
    -- 1. Ensure 'form_id' column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_submissions' AND column_name = 'form_id'
    ) THEN
        ALTER TABLE form_submissions ADD COLUMN form_id UUID REFERENCES forms(id) ON DELETE CASCADE;
    END IF;

    -- 2. Ensure 'data' column exists (JSONB for all form fields)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_submissions' AND column_name = 'data'
    ) THEN
        ALTER TABLE form_submissions ADD COLUMN data JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;

    -- 3. Ensure 'source_url' column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_submissions' AND column_name = 'source_url'
    ) THEN
        ALTER TABLE form_submissions ADD COLUMN source_url TEXT;
    END IF;

    -- 4. Ensure 'email' column exists (optional, extracted from data)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_submissions' AND column_name = 'email'
    ) THEN
        ALTER TABLE form_submissions ADD COLUMN email TEXT;
    END IF;

    -- 5. Ensure 'created_at' column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_submissions' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE form_submissions ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at DESC);

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
