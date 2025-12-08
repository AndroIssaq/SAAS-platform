-- ============================================
-- QUICK FIX: Affiliate Foreign Key Error
-- ============================================
-- Copy and paste this in Supabase SQL Editor
-- Replace 'YOUR_EMAIL_HERE' with the actual affiliate email

-- Step 1: Find the user
SELECT 
    id AS user_id,
    email,
    created_at
FROM auth.users 
WHERE email = 'YOUR_EMAIL_HERE';

-- Copy the user_id from the result above

-- Step 2: Check if affiliate exists
SELECT * FROM affiliates WHERE user_id = 'PASTE_USER_ID_HERE';

-- Step 3: If no result, create the affiliate
INSERT INTO affiliates (
    user_id,
    name,
    email,
    phone,
    status,
    commission_rate
) VALUES (
    'PASTE_USER_ID_HERE',  -- من Step 1
    'اسم الشريك',           -- غير هذا
    'YOUR_EMAIL_HERE',      -- نفس الإيميل
    '01234567890',          -- رقم الهاتف
    'active',
    10.00
) RETURNING id, name, email;

-- Step 4: Verify
SELECT 
    a.id AS affiliate_id,
    a.user_id,
    a.name,
    a.email,
    a.status
FROM affiliates a
WHERE a.user_id = 'PASTE_USER_ID_HERE';

-- Now try creating a contract again - it should work!
