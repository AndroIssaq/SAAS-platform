-- SQL Script to remove unused/duplicate columns from contracts table
-- WARNING: Run this in Supabase SQL Editor after backing up your data!

-- Step 1: Drop old signature columns (replaced by admin_signature, client_signature)
ALTER TABLE contracts DROP COLUMN IF EXISTS signature_data;
ALTER TABLE contracts DROP COLUMN IF EXISTS signature_date;
ALTER TABLE contracts DROP COLUMN IF EXISTS admin_signature_data;
ALTER TABLE contracts DROP COLUMN IF EXISTS client_signature_data;
ALTER TABLE contracts DROP COLUMN IF EXISTS admin_signature_date;
ALTER TABLE contracts DROP COLUMN IF EXISTS client_signature_date;
ALTER TABLE contracts DROP COLUMN IF EXISTS admin_signed_by;

-- Step 2: Drop duplicate timestamp columns (replaced by admin_signature_at, client_signature_at)
ALTER TABLE contracts DROP COLUMN IF EXISTS admin_signed_at;
ALTER TABLE contracts DROP COLUMN IF EXISTS client_signed_at;

-- Step 3: Drop old URL columns (replaced by admin_id_card, client_id_card)
ALTER TABLE contracts DROP COLUMN IF EXISTS admin_id_card_url;
ALTER TABLE contracts DROP COLUMN IF EXISTS client_id_card_url;
ALTER TABLE contracts DROP COLUMN IF EXISTS admin_signature_url;
ALTER TABLE contracts DROP COLUMN IF EXISTS client_signature_url;

-- Step 4: Drop old upload timestamp columns (not used)
ALTER TABLE contracts DROP COLUMN IF EXISTS admin_id_uploaded_at;
ALTER TABLE contracts DROP COLUMN IF EXISTS client_id_uploaded_at;
ALTER TABLE contracts DROP COLUMN IF EXISTS admin_id_card_uploaded_at;
ALTER TABLE contracts DROP COLUMN IF EXISTS client_id_card_uploaded_at;

-- Step 5: Drop old payment proof columns (replaced by payment_proof_id foreign key)
ALTER TABLE contracts DROP COLUMN IF EXISTS payment_proof_url;
ALTER TABLE contracts DROP COLUMN IF EXISTS payment_proof_uploaded_at;
ALTER TABLE contracts DROP COLUMN IF EXISTS payment_proof_date;

-- Step 6: Drop duplicate payment verification columns (payment_approved is used)
ALTER TABLE contracts DROP COLUMN IF EXISTS payment_proof_verified;
ALTER TABLE contracts DROP COLUMN IF EXISTS payment_proof_verified_by;
ALTER TABLE contracts DROP COLUMN IF EXISTS payment_proof_verified_at;
ALTER TABLE contracts DROP COLUMN IF EXISTS payment_verified_at;
ALTER TABLE contracts DROP COLUMN IF EXISTS payment_verified_by;

-- Step 7: Drop unused PDF columns (PDFs are generated dynamically, not stored)
ALTER TABLE contracts DROP COLUMN IF EXISTS pdf_url;
ALTER TABLE contracts DROP COLUMN IF EXISTS final_pdf_url;

-- Step 8: Drop contract_link_token (if not used for public links)
-- ALTER TABLE contracts DROP COLUMN IF EXISTS contract_link_token;  -- Uncomment if confirmed unused

-- Step 9: Drop last_updated (replaced by updated_at)
ALTER TABLE contracts DROP COLUMN IF EXISTS last_updated;

-- Step 10: Drop unused step columns (only step 1 and 6 are actually used in your flow)
ALTER TABLE contracts DROP COLUMN IF EXISTS step_2_completed;
ALTER TABLE contracts DROP COLUMN IF EXISTS step_2_data;
ALTER TABLE contracts DROP COLUMN IF EXISTS step_3_completed;
ALTER TABLE contracts DROP COLUMN IF EXISTS step_3_data;
ALTER TABLE contracts DROP COLUMN IF EXISTS step_4_completed;
ALTER TABLE contracts DROP COLUMN IF EXISTS step_4_data;
ALTER TABLE contracts DROP COLUMN IF EXISTS step_5_completed;
ALTER TABLE contracts DROP COLUMN IF EXISTS step_5_data;
ALTER TABLE contracts DROP COLUMN IF EXISTS step_7_completed;
ALTER TABLE contracts DROP COLUMN IF EXISTS step_7_data;
ALTER TABLE contracts DROP COLUMN IF EXISTS step_8_completed;
ALTER TABLE contracts DROP COLUMN IF EXISTS step_8_data;

-- Step 11: Drop current_step (workflow_status and current_step_name are used instead)
ALTER TABLE contracts DROP COLUMN IF EXISTS current_step;

-- Step 12: Drop integrity_hash (if not implemented)
ALTER TABLE contracts DROP COLUMN IF EXISTS integrity_hash;

-- Step 13: Verify remaining columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contracts' 
ORDER BY ordinal_position;

-- Expected remaining columns:
-- id, account_id, contract_number, client_id, affiliate_id, service_id, created_by
-- client_name, client_email, client_phone, company_name
-- service_type, package_name, service_description
-- total_amount, deposit_amount, remaining_amount, payment_method
-- contract_terms, timeline, deliverables, notes
-- status, workflow_status, current_step_name
-- admin_signature, client_signature, admin_signature_at, client_signature_at
-- admin_id_card, client_id_card
-- payment_proof_id, payment_approved, payment_approved_at
-- created_at, updated_at, progress_updated_at
-- finalized, finalized_at
-- review_completed_at, signatures_completed_at, id_cards_completed_at
-- otp_verified, otp_code, otp_sent_at, otp_verified_at, otp_attempts
-- encrypted_payload, encryption_version, encryption_public_key
-- step_1_completed, step_1_data, step_6_completed, step_6_data
-- legal_timestamp, verification_metadata, client_ip_address, admin_ip_address
-- payment_schedule, affiliate_commission_amount, affiliate_commission_percentage
-- affiliate_payment_proof_url, affiliate_commission_paid, affiliate_commission_paid_at
-- admin_review_approved, client_review_approved, affiliate_review_approved
-- payment_proof_notes, payment_proof_method, admin_payment_proof_reviewed
