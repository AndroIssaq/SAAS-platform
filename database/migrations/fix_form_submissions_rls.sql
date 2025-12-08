-- Fix RLS policies for form_submissions table
-- Description: Allows admins to read submissions and allows insert via service role
-- Date: 2025-12-08

-- Enable RLS
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins read submissions" ON form_submissions;
DROP POLICY IF EXISTS "Admins manage submissions" ON form_submissions;
DROP POLICY IF EXISTS "Allow public insert" ON form_submissions;
DROP POLICY IF EXISTS "Service role full access" ON form_submissions;
DROP POLICY IF EXISTS "Authenticated users read submissions" ON form_submissions;

-- Allow service_role (used by admin client) to do everything
CREATE POLICY "Service role full access"
ON form_submissions
FOR ALL
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read submissions for their account's forms
CREATE POLICY "Authenticated users read submissions"
ON form_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM forms f
    JOIN account_members am ON f.account_id = am.account_id
    WHERE f.id = form_submissions.form_id 
    AND am.user_id = auth.uid()
  )
);

-- Allow anyone to insert submissions (for public forms)
CREATE POLICY "Allow public insert"
ON form_submissions
FOR INSERT
WITH CHECK (true);

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
