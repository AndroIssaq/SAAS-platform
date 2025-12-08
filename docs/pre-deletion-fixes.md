# قائمة الملفات التي تحتاج إصلاح قبل حذف الأعمدة

## الملفات التي تستخدم الحقول القديمة:

### 1. ✅ app/affiliate/contracts/[id]/page.tsx
**المشكلة:** يستخدم `admin_signature_data` و `client_signature_data`
**الحل:** استبدالها بـ `admin_signature` و `client_signature`

**السطور 275, 278:**
```tsx
// قبل:
adminSignature={contract.admin_signature_data}
clientSignature={contract.client_signature_data}

// بعد:
adminSignature={contract.admin_signature}
clientSignature={contract.client_signature}
```

---

### 2. ✅ hooks/use-contract-realtime.ts
**المشكلة:** يستخدم `payment_proof_url`, `step_4_completed`,  `step_5_completed`, `step_6_completed`
**الحل:** استخدام الحقول الجديدة

**السطور 12-16, 36:**
```typescript
// قبل:
interface ContractRealtimeData {
  payment_proof_url: string | null
  payment_proof_verified: boolean
  step_4_completed: boolean
  step_5_completed: boolean
  step_6_completed: boolean
}

// بعد:
interface ContractRealtimeData {
  payment_proof_id: string | null
  payment_approved: boolean  
  admin_id_card: string | null
  client_id_card: string | null
  otp_verified: boolean
}
```

---

### 3. ✅ components/client/contracts-list-realtime.tsx
**المشكلة:** يستخدم `payment_proof_url` و `payment_proof_verified`
**الحل:** استخدام `payment_proof_id` و `payment_approved`

**السطر 111:**
```tsx
// قبل:
c.current_step === 6 && c.payment_proof_url && !c.payment_proof_verified

// بعد:
c.current_step_name === 'payment_approval' && c.payment_proof_id && !c.payment_approved
```

---

### 4. ✅ app/affiliate/contracts/[id]/review/page.tsx
**السطور 79, 216, 244:**
```tsx
// قبل:
const isPaymentProofPending = contractData.payment_proof_url && !contractData.payment_proof_verified
paymentProofUrl={contractData.payment_proof_url}
{!contractData.payment_proof_url && (...)}

// بعد:  
const isPaymentProofPending = contractData.payment_proof_id && !contractData.payment_approved
paymentProofId={contractData.payment_proof_id}
{!contractData.payment_proof_id && (...)}
```

---

### 5. ✅ app/admin/contracts/[id]/review/page.tsx
**السطور 71, 208, 236:**
نفس التغيير المطلوب في الملف السابق

---

### 6. ✅ lib/types/contract-wizard.ts  
**السطر 104:**
```typescript
// قبل:
admin_id_card_url?: string

// بعد:
admin_id_card?: string
```

---

## ✅ خطة العمل:

1. أصلح جميع الملفات المذكورة أعلاه
2. نختبر المنصة
3. نحذف الأعمدة القديمة

**الحالة:** جاري التنفيذ...
