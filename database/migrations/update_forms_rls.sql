-- Fix: Update RLS policies for forms to allow account owners to manage them
-- Description: Drops old restrictive admin-only policy and adds account-based access control
-- Date: 2025-12-08

-- 1. Enable RLS (just in case)
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- 2. Drop the old restrictive policy if it exists
DROP POLICY IF EXISTS "Admins manage forms" ON forms;

-- 3. Create a new comprehensive policy for Account Members
-- This allows users to Select, Insert, Update, Delete forms ONLY IF they are a member of the form's assigned account.

CREATE POLICY "Account members manage forms"
ON forms
FOR ALL
USING (
  -- For SELECT, UPDATE, DELETE: Check if the current user is a member of the form's account
  EXISTS (
    SELECT 1 
    FROM account_members 
    WHERE account_members.account_id = forms.account_id 
    AND account_members.user_id = auth.uid()
  )
)
WITH CHECK (
  -- For INSERT, UPDATE: Check if the current user is a member of the *target* account_id
  EXISTS (
    SELECT 1 
    FROM account_members 
    WHERE account_members.account_id = forms.account_id 
    AND account_members.user_id = auth.uid()
  )
);

-- 4. public read access for forms (needed for public embeds)
-- (This might duplicate "Public read forms", but using 'IF NOT EXISTS' logic isn't standard for policies, so we drop and recreate to be safe)
DROP POLICY IF EXISTS "Public read forms" ON forms;
CREATE POLICY "Public read forms"
ON forms
FOR SELECT
USING (true);

-- 5. Force schema cache reload again, just to be safe
NOTIFY pgrst, 'reload schema';
