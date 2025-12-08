-- Workspace-level public keys (one per account)
create table if not exists workspace_keys (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  public_key text not null,
  key_type text not null default 'curve25519',
  encryption_version text not null default 'v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id)
);

-- Individual envelopes: encrypted workspace key material per member
create table if not exists workspace_member_key_envelopes (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  member_user_id uuid not null references users(id) on delete cascade,
  encrypted_workspace_key text not null,
  key_version text not null default 'v1',
  created_at timestamptz not null default now(),
  unique(account_id, member_user_id)
);

create index if not exists workspace_member_key_envelopes_account_member_idx
  on workspace_member_key_envelopes(account_id, member_user_id);
