-- ============================================
-- Fix: Affiliate Foreign Key Constraint Issue
-- ============================================
-- Date: 2025-11-03
-- Problem: contracts.affiliate_id references non-existent affiliates
-- Solution: Make affiliate_id nullable and add proper constraint

-- ============================================
-- 1. Check current constraint
-- ============================================
-- Run this first to see the current constraint:
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='contracts'
  AND kcu.column_name = 'affiliate_id';

-- ============================================
-- 2. Check if affiliates table exists
-- ============================================
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'affiliates'
);

-- ============================================
-- 3. Check current affiliate records
-- ============================================
SELECT 
    id,
    user_id,
    name,
    email,
    created_at
FROM affiliates
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 4. Check contracts with invalid affiliate_id
-- ============================================
SELECT 
    c.id,
    c.contract_number,
    c.affiliate_id,
    a.id AS affiliate_exists
FROM contracts c
LEFT JOIN affiliates a ON c.affiliate_id = a.id
WHERE c.affiliate_id IS NOT NULL
  AND a.id IS NULL;

-- ============================================
-- 5. Fix: Make affiliate_id nullable (if not already)
-- ============================================
ALTER TABLE contracts 
ALTER COLUMN affiliate_id DROP NOT NULL;

-- ============================================
-- 6. Fix: Drop old constraint if exists
-- ============================================
-- Replace 'contracts_affiliate_id_fkey' with actual constraint name from step 1
ALTER TABLE contracts 
DROP CONSTRAINT IF EXISTS contracts_affiliate_id_fkey;

-- ============================================
-- 7. Fix: Add proper foreign key constraint
-- ============================================
ALTER TABLE contracts
ADD CONSTRAINT contracts_affiliate_id_fkey 
FOREIGN KEY (affiliate_id) 
REFERENCES affiliates(id)
ON DELETE SET NULL  -- If affiliate deleted, set to NULL
ON UPDATE CASCADE;  -- If affiliate ID changes, update

-- ============================================
-- 8. Add comment
-- ============================================
COMMENT ON CONSTRAINT contracts_affiliate_id_fkey ON contracts IS 
'Foreign key to affiliates table - nullable for 2-party contracts';

-- ============================================
-- 9. Verify the fix
-- ============================================
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='contracts'
  AND kcu.column_name = 'affiliate_id';

-- ============================================
-- IMPORTANT NOTES
-- ============================================
-- 
-- This error happens when:
-- 1. The affiliate_id you're trying to insert doesn't exist in affiliates table
-- 2. The user is not properly registered as an affiliate
-- 
-- To fix for a specific user:
-- 
-- Step 1: Check if user exists in affiliates table
-- SELECT * FROM affiliates WHERE user_id = 'USER_ID_HERE';
-- 
-- Step 2: If not exists, create affiliate record
-- INSERT INTO affiliates (user_id, name, email, phone, status)
-- VALUES (
--   'USER_ID_HERE',
--   'Affiliate Name',
--   'email@example.com',
--   'phone_number',
--   'active'
-- );
-- 
-- Step 3: Get the affiliate ID
-- SELECT id FROM affiliates WHERE user_id = 'USER_ID_HERE';
-- 
-- Step 4: Use this ID when creating contracts
-- 
-- ============================================
