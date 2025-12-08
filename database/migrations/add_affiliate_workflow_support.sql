-- Migration: Add Affiliate Support to Contract Workflow
-- Description: Adds necessary columns to support 3-party contracts (Admin + Client + Affiliate)
-- Date: 2025-11-03

-- ============================================
-- 1. Add affiliate_review_approved column
-- ============================================
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS affiliate_review_approved BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN contracts.affiliate_review_approved IS 'Indicates if the affiliate has approved the contract in the review step';

-- ============================================
-- 2. Add current_step_name column for new flow
-- ============================================
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS current_step_name TEXT DEFAULT 'review';

COMMENT ON COLUMN contracts.current_step_name IS 'Current step in the new contract flow state machine';

-- ============================================
-- 3. Add completion timestamps for all steps
-- ============================================
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS review_completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS signatures_completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS id_cards_completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS payment_approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 4. Add admin payment proof review flag
-- ============================================
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS admin_payment_proof_reviewed BOOLEAN DEFAULT FALSE;

-- ============================================
-- 5. Add payment approval flag
-- ============================================
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS payment_approved BOOLEAN DEFAULT FALSE;

-- ============================================
-- 6. Add finalized flag
-- ============================================
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS finalized BOOLEAN DEFAULT FALSE;

-- ============================================
-- 7. Add OTP verification flag
-- ============================================
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT FALSE;

-- ============================================
-- 8. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_contracts_affiliate_id ON contracts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_contracts_current_step_name ON contracts(current_step_name);
CREATE INDEX IF NOT EXISTS idx_contracts_affiliate_review ON contracts(affiliate_review_approved) WHERE affiliate_id IS NOT NULL;

-- ============================================
-- 9. Update existing contracts
-- ============================================
-- Set current_step_name based on existing current_step
UPDATE contracts 
SET current_step_name = CASE 
    WHEN current_step = 1 THEN 'review'
    WHEN current_step = 2 THEN 'signatures'
    WHEN current_step = 3 THEN 'otp_verification'
    WHEN current_step = 4 THEN 'id_cards'
    WHEN current_step = 5 THEN 'payment_proof'
    WHEN current_step = 6 THEN 'payment_approval'
    WHEN current_step = 7 THEN 'finalization'
    ELSE 'review'
END
WHERE current_step_name IS NULL OR current_step_name = 'review';

-- Mark contracts without affiliate as not requiring affiliate approval
UPDATE contracts 
SET affiliate_review_approved = TRUE
WHERE affiliate_id IS NULL;

-- ============================================
-- 10. Add contract_activities table support for affiliates
-- ============================================
-- Ensure contract_activities table can handle affiliate actions
ALTER TABLE contract_activities 
ADD COLUMN IF NOT EXISTS participant_role TEXT;

COMMENT ON COLUMN contract_activities.participant_role IS 'Role of the participant: admin, client, or affiliate';

-- ============================================
-- 11. Create view for contract workflow status
-- ============================================
CREATE OR REPLACE VIEW contract_workflow_status AS
SELECT 
    c.id,
    c.contract_number,
    c.affiliate_id,
    c.current_step_name,
    c.admin_review_approved,
    c.client_review_approved,
    c.affiliate_review_approved,
    c.admin_signature IS NOT NULL AS admin_signed,
    c.client_signature IS NOT NULL AS client_signed,
    c.otp_verified,
    c.admin_id_card IS NOT NULL AS admin_id_uploaded,
    c.client_id_card IS NOT NULL AS client_id_uploaded,
    c.payment_proof_id IS NOT NULL AS payment_proof_uploaded,
    c.admin_payment_proof_reviewed,
    c.payment_approved,
    c.finalized,
    CASE 
        WHEN c.affiliate_id IS NOT NULL THEN '3-party'
        ELSE '2-party'
    END AS contract_type,
    CASE 
        WHEN c.finalized THEN 'completed'
        WHEN c.payment_approved THEN 'payment_approved'
        WHEN c.payment_proof_id IS NOT NULL THEN 'payment_pending'
        WHEN c.admin_id_card IS NOT NULL AND c.client_id_card IS NOT NULL THEN 'ids_uploaded'
        WHEN c.otp_verified THEN 'otp_verified'
        WHEN c.admin_signature IS NOT NULL AND c.client_signature IS NOT NULL THEN 'signed'
        WHEN c.admin_review_approved AND c.client_review_approved AND (c.affiliate_id IS NULL OR c.affiliate_review_approved) THEN 'approved'
        ELSE 'pending_review'
    END AS workflow_status
FROM contracts c;

COMMENT ON VIEW contract_workflow_status IS 'Provides a comprehensive view of contract workflow status for both 2-party and 3-party contracts';

-- ============================================
-- 12. Grant permissions
-- ============================================
GRANT SELECT ON contract_workflow_status TO authenticated;
GRANT SELECT ON contract_workflow_status TO service_role;

-- ============================================
-- Migration Complete
-- ============================================
-- This migration adds full support for 3-party contracts with affiliates
-- while maintaining backward compatibility with existing 2-party contracts
