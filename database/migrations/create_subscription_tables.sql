-- =============================================
-- Subscription System Tables
-- Created: 2024-12-08
-- =============================================

-- 1. Add trial_started_at to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' 
CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled'));

-- 2. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  
  -- Plan info
  plan_id TEXT NOT NULL CHECK (plan_id IN ('small_office', 'large_company', 'enterprise')),
  plan_name TEXT NOT NULL,
  price_egp DECIMAL(10,2) NOT NULL,
  
  -- Billing cycle
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  
  -- Dates
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create subscription_payments table
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  
  -- Payment details
  amount_egp DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('vodafone_cash', 'instapay', 'meeza', 'fawry', 'visa_mastercard', 'bank_transfer')),
  
  -- For manual payments
  transaction_reference TEXT,
  proof_image_url TEXT,
  proof_image_path TEXT,
  notes TEXT,
  
  -- Review
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_account_id ON subscriptions(account_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_account_id ON subscription_payments(account_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_review_status ON subscription_payments(review_status);
CREATE INDEX IF NOT EXISTS idx_accounts_subscription_status ON accounts(subscription_status);
CREATE INDEX IF NOT EXISTS idx_accounts_trial_started_at ON accounts(trial_started_at);

-- 5. RLS Policies

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Subscriptions: Users can view their own account's subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT
  USING (account_id IN (
    SELECT account_id FROM account_members WHERE user_id = auth.uid()
  ));

-- Subscriptions: Only service role can insert/update
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Payments: Users can view and insert for their own account
CREATE POLICY "Users can view own payments" ON subscription_payments
  FOR SELECT
  USING (account_id IN (
    SELECT account_id FROM account_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert payments" ON subscription_payments
  FOR INSERT
  WITH CHECK (account_id IN (
    SELECT account_id FROM account_members WHERE user_id = auth.uid()
  ));

-- Payments: Service role can manage all
CREATE POLICY "Service role can manage payments" ON subscription_payments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 6. Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_payments_updated_at ON subscription_payments;
CREATE TRIGGER update_subscription_payments_updated_at
  BEFORE UPDATE ON subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Initialize trial_started_at for existing accounts that don't have it
UPDATE accounts 
SET trial_started_at = created_at 
WHERE trial_started_at IS NULL;

-- Notify schema cache reload
NOTIFY pgrst, 'reload schema';
