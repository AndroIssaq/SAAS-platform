-- Fix RLS policies for client contracts access
-- This ensures clients can only see their own contracts

-- Enable RLS on contracts table if not already enabled
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "clients_read_own_contracts" ON contracts;
DROP POLICY IF EXISTS "clients_insert_contracts" ON contracts;
DROP POLICY IF EXISTS "clients_update_own_contracts" ON contracts;

-- Create policy for clients to read their own contracts
CREATE POLICY "clients_read_own_contracts" ON contracts
    FOR SELECT
    USING (
        auth.uid() IN (
            -- Direct user_id match (for contracts where user is the client)
            SELECT user_id FROM clients WHERE id = contracts.client_id
            
            UNION
            
            -- Email-based match (for contracts created before user registration)
            SELECT id FROM users WHERE email = contracts.client_email
        )
    );

-- Create policy for clients to insert contracts (for future self-service)
CREATE POLICY "clients_insert_contracts" ON contracts
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM clients WHERE id = contracts.client_id
        )
    );

-- Create policy for clients to update their own contracts (limited fields)
CREATE POLICY "clients_update_own_contracts" ON contracts
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM clients WHERE id = contracts.client_id
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM clients WHERE id = contracts.client_id
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_email ON contracts(client_email);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- Test the policies
-- This should return contracts for the current user
-- SELECT * FROM contracts WHERE client_id