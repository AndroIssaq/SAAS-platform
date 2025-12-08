alter table contracts
  add column if not exists encrypted_payload text,
  add column if not exists encryption_version text,
  add column if not exists encryption_public_key text;
