# 🤖 Cron Jobs API

## 📍 Endpoints

### `/api/cron/keep-alive`
**الغرض:** الحفاظ على Supabase نشط ومنع إيقافه بعد 14 يوم.

**الجدول:** كل 12 ساعة (00:00 و 12:00)

**الطريقة:** GET أو POST

**الاستجابة:**
```json
{
  "success": true,
  "message": "Supabase keep-alive ping successful",
  "queries_succeeded": 4,
  "total_queries": 4,
  "timestamp": "2024-10-29T04:10:00.000Z",
  "next_run": "في خلال 24 ساعة"
}
```

---

## 🧪 الاختبار

### محلي:
```bash
curl http://localhost:3000/api/cron/keep-alive
```

### Production:
```bash
curl https://your-domain.vercel.app/api/cron/keep-alive
```

### مع Authorization (إذا كان CRON_SECRET موجود):
```bash
curl -H "Authorization: Bearer your-secret" \
  https://your-domain.vercel.app/api/cron/keep-alive
```

---

## 📊 ما يحدث داخلياً

1. يتصل بـ Supabase
2. يعمل queries على 4 جداول:
   - `users`
   - `contracts`
   - `contract_activities`
   - `notifications`
3. يتحقق من نجاح الاستعلامات
4. يرجع النتيجة

---

## ⚙️ الإعداد

الـ cron مُعد تلقائياً في `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/keep-alive",
      "schedule": "0 */12 * * *"
    }
  ]
}
```

**لا يحتاج أي إعداد إضافي!** ✅

---

## 📝 إضافة Cron Jobs جديدة

### 1. أنشئ مجلد جديد:
```
app/api/cron/your-job-name/
```

### 2. أنشئ `route.ts`:
```typescript
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Your cron logic here
  return NextResponse.json({ success: true })
}
```

### 3. أضف في `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/your-job-name",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## 📅 Cron Schedule Syntax

```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

### أمثلة:
- `0 0 * * *` - كل يوم منتصف الليل
- `0 */12 * * *` - كل 12 ساعة
- `0 */6 * * *` - كل 6 ساعات
- `*/30 * * * *` - كل 30 دقيقة
- `0 0 * * 0` - كل أحد منتصف الليل

---

## 🔍 المراقبة

### Vercel Logs:
```
Deployments → [Your Deployment] → Logs
```

ابحث عن:
```
✅ Supabase keep-alive successful: 4/4 queries succeeded
```

---

تم التوثيق ✅
