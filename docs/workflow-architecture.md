# لماذا step_2 إلى step_8 تظهر NULL؟

## 🔍 التفسير

الـ workflow الحالي **لا يستخدم** الحقول `step_2_completed`, `step_2_data` ... `step_8_completed`, `step_8_data` على الإطلاق!

### البنية الفعلية للـ Workflow:

بدلاً من استخدام الأرقام، النظام يستخدم:

1. **`workflow_status`** - الحالة الحالية
2. **`current_step_name`** - اسم الخطوة الحالية (review, signatures, otp_verification, etc.)
3. **حقول مباشرة** - لكل خطوة حقلها الخاص

### مقارنة البنية:

```
❌ الطريقة القديمة (غير مستخدمة):
- step_1_completed, step_1_data
- step_2_completed, step_2_data
- step_3_completed, step_3_data
... إلخ

✅ الطريقة الفعلية (المستخدمة):
- current_step_name: 'review' | 'signatures' | 'otp_verification' | ...
- admin_review_approved: boolean
- client_review_approved: boolean
- admin_signature: string (URL)
- client_signature: string (URL)
- admin_signature_at: timestamp
- client_signature_at: timestamp
- otp_verified: boolean
- otp_code: string
- otp_verified_at: timestamp
- admin_id_card: string (URL)
- client_id_card: string (URL)
- payment_proof_id: UUID (FK)
- payment_approved: boolean
- payment_approved_at: timestamp
- finalized: boolean
- finalized_at: timestamp
```

## 📊 تتبع الخطوات الفعلي:

| الخطوة | current_step_name | الحقول المستخدمة |
|--------|------------------|------------------|
| 1. المراجعة | `review` | `admin_review_approved`, `client_review_approved`, `review_completed_at` |
| 2. التوقيعات | `signatures` | `admin_signature`, `client_signature`, `admin_signature_at`, `client_signature_at`, `signatures_completed_at` |
| 3. OTP | `otp_verification` | `otp_verified`, `otp_code`, `otp_verified_at`, `otp_sent_at` |
| 4. البطاقات | `id_cards` | `admin_id_card`, `client_id_card`, `id_cards_completed_at` |
| 5. إثبات الدفع | `payment_proof` | `payment_proof_id` (FK to payment_proofs table) |
| 6. الموافقة | `payment_approval` | `payment_approved`, `payment_approved_at` |
| 7. الإتمام | `finalization` | `finalized`, `finalized_at` |

## 🎯 الاستثناءات:

فقط حقلان **يتم استخدامهما**:
- ✅ `step_1_data` - يحتوي على بيانات العقد الأولية (client_info, service_info)
- ✅ `step_6_data` - يحتوي على بيانات إثبات الدفع (amount, proof_image_url, transaction_reference)

## 💡 الحلول:

### الخيار 1: حذف الحقول غير المستخدمة (موصى به ⭐)
```sql
-- من ملف cleanup-unused-columns.sql
ALTER TABLE contracts DROP COLUMN IF NOT EXISTS step_2_completed;
ALTER TABLE contracts DROP COLUMN IF NOT EXISTS step_2_data;
ALTER TABLE contracts DROP COLUMN IF NOT EXISTS step_3_completed;
ALTER TABLE contracts DROP COLUMN IF NOT EXISTS step_3_data;
-- ... إلخ
```

**المزايا:**
- ✅ تقليل حجم قاعدة البيانات
- ✅ كود أنظف
- ✅ لا استخدام لها حالياً

### الخيار 2: الإبقاء عليها كما هي (الوضع الحالي)
- لن تؤثر على شيء
- ستظل NULL
- فقط تأخذ مساحة في DB

### الخيار 3: ملء البيانات (غير ضروري)
يمكن تعديل الكود لملء `step_2_data` ... `step_8_data` ولكن:
- ❌ غير ضروري - البيانات موجودة في حقول أخرى
- ❌ تكرار للبيانات
- ❌ زيادة تعقيد الكود

## 🔧 التوصية:

**احذف الحقول غير المستخدمة** باستخدام `cleanup-unused-columns.sql`

هذا لن يؤثر على أي شيء لأن الكود **لا يقرأها أصلاً**.
