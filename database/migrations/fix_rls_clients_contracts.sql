-- Fix and harden RLS policies for clients and contracts
-- Goal: allow end-clients to access their own client profile and contracts securely,
-- while keeping full CRUD for account members (owner/admin) and preventing unsafe inserts by clients.

begin;

-- Ensure RLS is enabled (safe if already enabled)
alter table public.clients enable row level security;
alter table public.contracts enable row level security;

-- 1) Contracts: remove unsafe client inserts (contracts should be created by account members only)
drop policy if exists clients_insert_contracts on public.contracts;

-- Break recursion: rework contract client policies to avoid referencing clients
-- Old policies referenced clients, while clients policies referenced contracts, causing a cycle.
drop policy if exists clients_read_own_contracts on public.contracts;
drop policy if exists clients_update_own_contracts on public.contracts;

-- New policies rely solely on matching the authenticated user's email to contracts.client_email
create policy contracts_client_select_by_email
  on public.contracts
  as permissive
  for select
  to public
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and lower(u.email) = lower(contracts.client_email)
    )
  );

create policy contracts_client_update_by_email
  on public.contracts
  as permissive
  for update
  to public
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and lower(u.email) = lower(contracts.client_email)
    )
  )
  with check (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and lower(u.email) = lower(contracts.client_email)
    )
  );

-- 2) Clients: allow end-clients to read their own profile
--    a) Directly via clients.user_id = auth.uid()
drop policy if exists clients_select_self on public.clients;
create policy clients_select_self
  on public.clients
  as permissive
  for select
  to public
  using (
    clients.user_id = auth.uid()
  );

--    b) Via a linked contract email (supports legacy rows where clients.user_id is NULL)
drop policy if exists clients_select_by_contract_email on public.clients;
create policy clients_select_by_contract_email
  on public.clients
  as permissive
  for select
  to public
  using (
    exists (
      select 1
      from public.contracts c
      join public.users u on u.id = auth.uid()
      where c.client_id = clients.id
        and c.client_email = u.email
    )
  );

-- 3) Clients: allow end-clients to update their own profile safely
--    a) When clients.user_id is present
drop policy if exists clients_update_self on public.clients;
create policy clients_update_self
  on public.clients
  as permissive
  for update
  to public
  using (
    clients.user_id = auth.uid()
  )
  with check (
    clients.user_id = auth.uid()
  );

--    b) When user is linked by contract email (for legacy rows)
drop policy if exists clients_update_by_contract_email on public.clients;
create policy clients_update_by_contract_email
  on public.clients
  as permissive
  for update
  to public
  using (
    exists (
      select 1
      from public.contracts c
      join public.users u on u.id = auth.uid()
      where c.client_id = clients.id
        and c.client_email = u.email
    )
  )
  with check (
    exists (
      select 1
      from public.contracts c
      join public.users u on u.id = auth.uid()
      where c.client_id = clients.id
        and c.client_email = u.email
    )
  );

-- Note:
-- - Existing member policies (via account_members) remain in place to grant full access to owners/admins.
-- - Contracts already have permissive SELECT/UPDATE policies for clients by user_id and by contract email.
-- - We intentionally removed client INSERT on contracts to prevent abuse.

commit;