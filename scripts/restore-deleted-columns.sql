-- SQL Script to RESTORE deleted columns from contracts table
-- Use this ONLY if you accidentally ran cleanup-unused-columns.sql

-- Step 1: Restore old signature columns
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signature_data TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signature_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS admin_signature_data TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_signature_data TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS admin_signature_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_signature_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS admin_signed_by UUID;

-- Step 2: Restore duplicate timestamp columns
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS admin_signed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_signed_at TIMESTAMP WITH TIME ZONE;

-- Step 3: Restore old URL columns
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS admin_id_card_url TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_id_card_url TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS admin_signature_url TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_signature_url TEXT;

-- Step 4: Restore old upload timestamp columns
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS admin_id_uploaded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_id_uploaded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS admin_id_card_uploaded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_id_card_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Step 5: Restore old payment proof columns
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_proof_date TIMESTAMP WITH TIME ZONE;

-- Step 6: Restore duplicate payment verification columns
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_proof_verified BOOLEAN;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_proof_verified_by UUID;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_proof_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_verified_by UUID;

-- Step 7: Restore unused PDF columns
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS final_pdf_url TEXT;

-- Step 8: Restore contract_link_token
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_link_token TEXT;

-- Step 9: Restore last_updated
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE;

-- Step 10: Restore unused step columns
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS step_2_completed BOOLEAN;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS step_2_data JSONB;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS step_3_completed BOOLEAN;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS step_3_data JSONB;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS step_4_completed BOOLEAN;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS step_4_data JSONB;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS step_5_completed BOOLEAN;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS step_5_data JSONB;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS step_7_completed BOOLEAN;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS step_7_data JSONB;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS step_8_completed BOOLEAN;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS step_8_data JSONB;

-- Step 11: Restore current_step
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS current_step INTEGER;

-- Step 12: Restore integrity_hash
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS integrity_hash TEXT;

-- Verify columns are restored
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contracts' 
ORDER BY ordinal_position;
