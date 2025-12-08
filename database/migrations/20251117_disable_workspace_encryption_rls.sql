-- Temporarily disable RLS on workspace encryption tables while server-side guards handle access
alter table if exists workspace_keys disable row level security;
alter table if exists workspace_member_key_envelopes disable row level security;

-- Drop custom helper and policies if they exist
 drop function if exists is_user_member_of_account(uuid);

 drop policy if exists "workspace_keys_select" on workspace_keys;
 drop policy if exists "workspace_keys_insert" on workspace_keys;
 drop policy if exists "workspace_keys_update" on workspace_keys;

 drop policy if exists "workspace_member_envelopes_select" on workspace_member_key_envelopes;
 drop policy if exists "workspace_member_envelopes_insert" on workspace_member_key_envelopes;
 drop policy if exists "workspace_member_envelopes_update" on workspace_member_key_envelopes;
