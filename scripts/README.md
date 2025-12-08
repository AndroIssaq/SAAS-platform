# Database Migration Scripts

## 🔒 Encrypt Legacy Data

### Prerequisites
1. Set environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ENCRYPTION_KEY=your_32_byte_hex_key
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Run Migration
```bash
npx tsx scripts/encrypt-legacy-data.ts
```

This will:
- ✅ Encrypt all plain text in `contracts` table: `client_name`, `client_email`, `client_phone`, `service_description`, `notes`, `step_1_data`
- ✅ Encrypt all plain text in `users` table: `full_name`, `phone`
- ⏭️ Skip already encrypted data

---

## 🗑️ Cleanup Unused Columns

### WARNING: BACKUP FIRST!
Before running the cleanup SQL, **create a backup** of your database!

### Columns to be Removed:
1. **Old Signature Fields** (replaced by `admin_signature`, `client_signature`):
   - `signature_data`, `signature_date`
   - `admin_signature_data`, `client_signature_data`
   - `admin_signature_date`, `client_signature_date`
   - `admin_signed_by`, `admin_signed_at`, `client_signed_at`

2. **Old URL Fields** (replaced):
   - `admin_id_card_url`, `client_id_card_url`
   - `admin_signature_url`, `client_signature_url`
   - `payment_proof_url`

3. **Old Timestamp Fields**:
   - `admin_id_uploaded_at`, `client_id_uploaded_at`
   - `admin_id_card_uploaded_at`, `client_id_card_uploaded_at`
   - `payment_proof_uploaded_at`, `payment_proof_date`

4. **Duplicate Payment Fields**:
   - `payment_proof_verified`, `payment_proof_verified_by`, `payment_proof_verified_at`
   - `payment_verified_at`, `payment_verified_by`

5. **Unused PDF Fields** (generated dynamically):
   - `pdf_url`, `final_pdf_url`

6. **Duplicate Tracking**:
   - `last_updated` (use `updated_at`)
   - `current_step` (use `current_step_name`)

7. **Unused Step Fields** (only step 1 and 6 used):
   - `step_2_*`, `step_3_*`, `step_4_*`, `step_5_*`, `step_7_*`, `step_8_*`

8. **Not Implemented**:
   - `integrity_hash`

### Run Cleanup
1. Open Supabase SQL Editor
2. Copy content from `cleanup-unused-columns.sql`
3. Review carefully
4. Execute

---

## 📊 Verification

After running both scripts:

1. Check encryption:
   ```bash
   # Visit your app at /admin/security
   # You should see encrypted data in all tables
   ```

2. Check columns:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'contracts' 
   ORDER BY ordinal_position;
   ```

3. Test the app thoroughly to ensure nothing broke!

---

## 🔄 Rollback Plan

If something goes wrong:

1. **For encryption**: You can decrypt data using the same encryption key
2. **For column deletion**: **Restore from backup** (columns cannot be recovered once dropped)

Always test in a staging environment first!
