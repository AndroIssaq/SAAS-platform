-- Add columns for encryption explanation step
alter table if exists contracts
  add column if not exists encryption_understood boolean default false,
  add column if not exists encryption_understood_at timestamptz;
