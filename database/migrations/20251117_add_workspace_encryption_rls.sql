-- Secure workspace encryption metadata with RLS policies

-- Helper function to check workspace membership without triggering recursive RLS
create or replace function is_user_member_of_account(target_account uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or target_account is null then
    return false;
  end if;
  return with_admin_privileges( ->
    exists (
      select 1 from account_members
      where account_id = target_account
        and user_id = current_user_id
    )
  );
end;
$$;

grant execute on function is_user_member_of_account(uuid) to authenticated;

-- workspace_keys policies
alter table if exists workspace_keys enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workspace_keys' and policyname = 'workspace_keys_select') then
    create policy "workspace_keys_select" on workspace_keys
      for select
      using (
        is_user_member_of_account(workspace_keys.account_id)
      );
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workspace_keys' and policyname = 'workspace_keys_insert') then
    create policy "workspace_keys_insert" on workspace_keys
      for insert
      with check (
        is_user_member_of_account(workspace_keys.account_id)
      );
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workspace_keys' and policyname = 'workspace_keys_update') then
    create policy "workspace_keys_update" on workspace_keys
      for update
      using (
        is_user_member_of_account(workspace_keys.account_id)
      )
      with check (
        is_user_member_of_account(workspace_keys.account_id)
      );
  end if;
end$$;

-- workspace_member_key_envelopes policies
alter table if exists workspace_member_key_envelopes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workspace_member_key_envelopes' and policyname = 'workspace_member_envelopes_select') then
    create policy "workspace_member_envelopes_select" on workspace_member_key_envelopes
      for select
      using (
        member_user_id = auth.uid()
        and is_user_member_of_account(workspace_member_key_envelopes.account_id)
      );
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workspace_member_key_envelopes' and policyname = 'workspace_member_envelopes_insert') then
    create policy "workspace_member_envelopes_insert" on workspace_member_key_envelopes
      for insert
      with check (
        member_user_id = auth.uid()
        and is_user_member_of_account(workspace_member_key_envelopes.account_id)
      );
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workspace_member_key_envelopes' and policyname = 'workspace_member_envelopes_update') then
    create policy "workspace_member_envelopes_update" on workspace_member_key_envelopes
      for update
      using (
        member_user_id = auth.uid()
        and is_user_member_of_account(workspace_member_key_envelopes.account_id)
      )
      with check (
        member_user_id = auth.uid()
        and is_user_member_of_account(workspace_member_key_envelopes.account_id)
      );
  end if;
end$$;
