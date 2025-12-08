-- Ensure legacy contract columns exist for new contract flow
alter table if exists contracts
  add column if not exists service_id uuid,
  add column if not exists client_name text,
  add column if not exists client_email text,
  add column if not exists client_phone text,
  add column if not exists company_name text,
  add column if not exists service_description text,
  add column if not exists timeline text,
  add column if not exists deliverables text[] default '{}',
  add column if not exists notes text,
  add column if not exists created_by uuid,
  add column if not exists current_step integer default 1,
  add column if not exists step_1_completed boolean default false,
  add column if not exists step_1_data jsonb default '{}',
  add column if not exists encrypted_payload text,
  add column if not exists encryption_version text,
  add column if not exists encryption_public_key text;
