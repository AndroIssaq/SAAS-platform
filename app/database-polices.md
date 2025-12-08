[
  {
    "schemaname": "public",
    "tablename": "account_members",
    "policyname": "account_members_manage_owner_admin",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = account_members.account_id) AND (m.user_id = auth.uid()) AND (m.role = ANY (ARRAY['owner'::text, 'admin'::text])))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = account_members.account_id) AND (m.user_id = auth.uid()) AND (m.role = ANY (ARRAY['owner'::text, 'admin'::text])))))"
  },
  {
    "schemaname": "public",
    "tablename": "account_members",
    "policyname": "account_members_select_member",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = account_members.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "accounts",
    "policyname": "accounts_insert_owner",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(owner_user_id = auth.uid())"
  },
  {
    "schemaname": "public",
    "tablename": "accounts",
    "policyname": "accounts_insert_public",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(owner_user_id = auth.uid())"
  },
  {
    "schemaname": "public",
    "tablename": "accounts",
    "policyname": "accounts_select_member",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((owner_user_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = accounts.id) AND (m.user_id = auth.uid())))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "accounts",
    "policyname": "accounts_update_owner",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(owner_user_id = auth.uid())",
    "with_check": "(owner_user_id = auth.uid())"
  },
  {
    "schemaname": "public",
    "tablename": "activity_log",
    "policyname": "activity_log_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = activity_log.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = activity_log.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "affiliates",
    "policyname": "affiliates_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = affiliates.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = affiliates.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "policyname": "clients_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = clients.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = clients.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "policyname": "clients_member_crud",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = clients.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = clients.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "policyname": "clients_select_by_contract_email",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM (contracts c\n     JOIN users u ON ((u.id = auth.uid())))\n  WHERE ((c.client_id = clients.id) AND (c.client_email = u.email))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "policyname": "clients_select_self",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "policyname": "clients_update_by_contract_email",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(EXISTS ( SELECT 1\n   FROM (contracts c\n     JOIN users u ON ((u.id = auth.uid())))\n  WHERE ((c.client_id = clients.id) AND (c.client_email = u.email))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM (contracts c\n     JOIN users u ON ((u.id = auth.uid())))\n  WHERE ((c.client_id = clients.id) AND (c.client_email = u.email))))"
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "policyname": "clients_update_self",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": "(user_id = auth.uid())"
  },
  {
    "schemaname": "public",
    "tablename": "contract_activities",
    "policyname": "contract_activities_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_activities.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_activities.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "contract_activity_log",
    "policyname": "contract_activity_log_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_activity_log.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_activity_log.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "contract_deletion_requests",
    "policyname": "contract_deletion_requests_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_deletion_requests.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_deletion_requests.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "contract_latest_modifications",
    "policyname": "contract_latest_modifications_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_latest_modifications.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_latest_modifications.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "contract_modifications",
    "policyname": "contract_modifications_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_modifications.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_modifications.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "contract_notifications",
    "policyname": "contract_notifications_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_notifications.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_notifications.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "contract_otp",
    "policyname": "contract_otp_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_otp.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_otp.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "contract_payment_status",
    "policyname": "contract_payment_status_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_payment_status.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_payment_status.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "contract_workflow_status",
    "policyname": "contract_workflow_status_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_workflow_status.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contract_workflow_status.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "contracts",
    "policyname": "contracts_client_select_by_email",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM users u\n  WHERE ((u.id = auth.uid()) AND (lower(u.email) = lower(contracts.client_email)))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "contracts",
    "policyname": "contracts_client_update_by_email",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(EXISTS ( SELECT 1\n   FROM users u\n  WHERE ((u.id = auth.uid()) AND (lower(u.email) = lower(contracts.client_email)))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM users u\n  WHERE ((u.id = auth.uid()) AND (lower(u.email) = lower(contracts.client_email)))))"
  },
  {
    "schemaname": "public",
    "tablename": "contracts",
    "policyname": "contracts_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contracts.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contracts.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "contracts",
    "policyname": "contracts_member_crud",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contracts.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = contracts.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "email_logs",
    "policyname": "email_logs_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = email_logs.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = email_logs.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "forms",
    "policyname": "forms_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = forms.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = forms.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "messages",
    "policyname": "messages_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = messages.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = messages.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "notifications",
    "policyname": "notifications_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = notifications.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = notifications.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "payment_proofs",
    "policyname": "payment_proofs_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = payment_proofs.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = payment_proofs.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "payouts",
    "policyname": "payouts_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = payouts.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = payouts.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "portfolio",
    "policyname": "portfolio_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = portfolio.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = portfolio.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "project_updates",
    "policyname": "project_updates_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = project_updates.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = project_updates.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "projects",
    "policyname": "projects_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = projects.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = projects.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "services",
    "policyname": "services_member_access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = services.account_id) AND (m.user_id = auth.uid()))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM account_members m\n  WHERE ((m.account_id = services.account_id) AND (m.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "users_select_self",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(id = auth.uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "users_update_self",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(id = auth.uid())",
    "with_check": "(id = auth.uid())"
  },
  {
    "schemaname": "storage",
    "tablename": "objects",
    "policyname": "storage_auth_delete_own_files_secure_buckets",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "((bucket_id = ANY (ARRAY['id-cards'::text, 'signatures'::text, 'payment-proofs'::text])) AND (owner = auth.uid()))",
    "with_check": null
  },
  {
    "schemaname": "storage",
    "tablename": "objects",
    "policyname": "storage_auth_select_own_files_secure_buckets",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "((bucket_id = ANY (ARRAY['id-cards'::text, 'signatures'::text, 'payment-proofs'::text])) AND (owner = auth.uid()))",
    "with_check": null
  },
  {
    "schemaname": "storage",
    "tablename": "objects",
    "policyname": "storage_auth_update_own_files_secure_buckets",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "((bucket_id = ANY (ARRAY['id-cards'::text, 'signatures'::text, 'payment-proofs'::text])) AND (owner = auth.uid()))",
    "with_check": "((bucket_id = ANY (ARRAY['id-cards'::text, 'signatures'::text, 'payment-proofs'::text])) AND (owner = auth.uid()))"
  },
  {
    "schemaname": "storage",
    "tablename": "objects",
    "policyname": "storage_auth_upload_secure_buckets",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((bucket_id = ANY (ARRAY['id-cards'::text, 'signatures'::text, 'payment-proofs'::text])) AND (owner = auth.uid()))"
  }
]