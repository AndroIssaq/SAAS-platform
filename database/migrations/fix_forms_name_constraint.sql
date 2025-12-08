-- Fix: Make 'name' column nullable in forms table
-- Description: The 'forms' table appears to have a required 'name' column, but the app uses 'title'. 
-- This migration removes the NOT NULL constraint from 'name' to prevent insertion errors.
-- Date: 2025-12-08

DO $$
BEGIN
    -- Check if 'name' column exists and make it nullable
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'forms' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE forms ALTER COLUMN name DROP NOT NULL;
    END IF;
END $$;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
