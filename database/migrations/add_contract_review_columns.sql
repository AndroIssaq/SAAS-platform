-- Migration: Ensure review approval flags exist on contracts
-- Fixes runtime errors: "Could not find the 'admin_review_approved' column of 'contracts' in the schema cache"
-- Adds missing columns used across UI and workflow state machines.

begin;

-- Add review approval flags if missing
alter table public.contracts
  add column if not exists admin_review_approved boolean default false;

alter table public.contracts
  add column if not exists client_review_approved boolean default false;

-- Helpful indexes for dashboards and filtering
create index if not exists idx_contracts_admin_review_approved on public.contracts(admin_review_approved);
create index if not exists idx_contracts_client_review_approved on public.contracts(client_review_approved);

-- Optional: backfill logic can be added here if you have historical approvals
-- Example (commented):
-- update public.contracts set admin_review_approved = true
--   where workflow_status in ('approved','completed') and admin_review_approved is distinct from true;

commit;