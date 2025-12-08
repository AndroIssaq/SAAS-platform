-- Ensure contracts table has client_email column required by createContract server action
alter table if exists contracts
  add column if not exists client_email text;
