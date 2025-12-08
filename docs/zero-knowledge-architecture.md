# Zero-Knowledge Architecture - الحل الكامل

## 🎯 المشكلة:

```
المدراء والشركاء قلقين من:
❌ صاحب المنصة يقدر يشوف بطاقات الهوية
❌ صاحب المنصة يقدر يشوف البيانات الشخصية
❌ أي admin في Supabase يقدر يوصل للداتا
```

---

## ✅ الحل: Zero-Knowledge Encryption

### المبدأ الأساسي:

```
🔐 كل Workspace (شركة) له مفتاح تشفير خاص به
🔑 المفتاح الخاص يُخزن ONLY في متصفح المستخدمين
📦 قاعدة البيانات تخزن فقط المفتاح العام
🚫 صاحب المنصة لا يملك المفتاح الخاص = لا يقدر يفك التشفير
```

---

## 🏗️ البنية الحالية (موجودة بالفعل!):

```sql
-- جدول workspace_keys موجود بالفعل!
CREATE TABLE workspace_keys (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL,
  public_key TEXT NOT NULL,        -- ✅ موجود
  key_type TEXT DEFAULT 'curve25519',
  encryption_version TEXT DEFAULT 'v1',
  created_at TIMESTAMP
);

-- جدول workspace_member_key_envelopes موجود!
CREATE TABLE workspace_member_key_envelopes (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL,
  member_user_id UUID NOT NULL,
  encrypted_workspace_key TEXT NOT NULL,  -- المفتاح الخاص مشفر بمفتاح المستخدم
  key_version TEXT DEFAULT 'v1'
);
```

**هذا يعني:** القاعدة جاهزة للـ Zero-Knowledge بالفعل! 🎉

---

## 🔧 كيف يعمل النظام:

### 1. عند إنشاء Workspace جديد:

```typescript
// في المتصفح (Client-Side):
1. User ينشئ workspace جديد
2. نولد Private/Public Key Pair في المتصفح
3. نرفع Public Key للسيرفر
4. نخزن Private Key في localStorage/IndexedDB المتصفح
5. نشفر Private Key بمفتاح المستخدم الشخصي
```

### 2. عند رفع بيانات حساسة (ID cards, signatures):

```typescript
// في المتصفح (Client-Side):
1. User يرفع صورة بطاقة الهوية
2. نقرأ الصورة كـ binary
3. نشفرها بالـ Private Key (من localStorage)
4. نرفع الصورة المشفرة للـ Storage
5. Supabase يخزن binary مشفر
```

### 3. عند عرض البيانات:

```typescript
// في المتصفح (Client-Side):
1. نجيب الصورة المشفرة من Storage
2. نفك تشفيرها بالـ Private Key (من localStorage)
3. نعرضها للمستخدم
```

### 4. صاحب المنصة (أنت):

```
❌ لا تملك الـ Private Key
❌ لا تقدر تفك تشفير الصور
❌ ترى فقط binary مشفر في Database
✅ يمكنك إدارة النظام بدون الوصول للبيانات
```

---

## 📊 المقارنة:

| الجانب | Server-Side Encryption (الحالي) | Zero-Knowledge (المقترح) |
|--------|--------------------------------|--------------------------|
| من يملك المفتاح | صاحب المنصة | المستخدم فقط |
| صاحب المنصة | ✅ يقدر يشوف كل شيء | ❌ لا يقدر يشوف شيء |
| Supabase Admin | ✅ يقدر يشوف كل شيء | ❌ يشوف بيانات مشفرة |
| الأمان | 🛡️ عالي | 🔐 أقصى |
| التعقيد | ⭐ بسيط | ⭐⭐⭐⭐ معقد |
| PDF/Email | ✅ يعمل | ⚠️ يحتاج معالجة خاصة |

---

## 🎯 التنفيذ المقترح:

### المرحلة 1: إعداد المفاتيح

```typescript
// lib/crypto/workspace-encryption.ts

import nacl from 'tweetnacl'
import { encodeBase64, decodeBase64 } from 'tweetnacl-util'

export class WorkspaceEncryption {
  
  // توليد مفاتيح جديدة للـ workspace
  static async generateWorkspaceKeys() {
    const keyPair = nacl.box.keyPair()
    return {
      publicKey: encodeBase64(keyPair.publicKey),
      privateKey: encodeBase64(keyPair.secretKey)
    }
  }
  
  // حفظ المفتاح الخاص في المتصفح
  static async savePrivateKey(accountId: string, privateKey: string) {
    const key = `workspace_private_key_${accountId}`
    localStorage.setItem(key, privateKey)
  }
  
  // جلب المفتاح الخاص
  static async getPrivateKey(accountId: string): Promise<string | null> {
    const key = `workspace_private_key_${accountId}`
    return localStorage.getItem(key)
  }
  
  // تشفير ملف (صورة، مستند)
  static async encryptFile(file: File, publicKey: string): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    const nonce = nacl.randomBytes(24)
    const publicKeyBytes = decodeBase64(publicKey)
    
    // استخدام secretbox للتشفير المتماثل (أسرع للملفات الكبيرة)
    const key = nacl.randomBytes(32)
    const encrypted = nacl.secretbox(uint8Array, nonce, key)
    
    // دمج nonce + encrypted data
    const combined = new Uint8Array(nonce.length + encrypted.length)
    combined.set(nonce)
    combined.set(encrypted, nonce.length)
    
    return new Blob([combined])
  }
  
  // فك تشفير ملف
  static async decryptFile(
    encryptedBlob: Blob, 
    privateKey: string
  ): Promise<Uint8Array | null> {
    const arrayBuffer = await encryptedBlob.arrayBuffer()
    const combined = new Uint8Array(arrayBuffer)
    
    // فصل nonce و encrypted data
    const nonce = combined.slice(0, 24)
    const encrypted = combined.slice(24)
    
    const privateKeyBytes = decodeBase64(privateKey)
    const key = privateKeyBytes.slice(0, 32) // استخدام جزء من المفتاح
    
    const decrypted = nacl.secretbox.open(encrypted, nonce, key)
    return decrypted
  }
}
```

### المرحلة 2: تطبيق على رفع الصور

```typescript
// components/contracts/flow-steps/id-cards-step.tsx

const handleUploadWithEncryption = async (file: File) => {
  // 1. جلب المفتاح العام للـ workspace
  const { data: workspaceKey } = await supabase
    .from('workspace_keys')
    .select('public_key')
    .eq('account_id', accountId)
    .single()
  
  if (!workspaceKey) {
    throw new Error('Workspace encryption not set up')
  }
  
  // 2. تشفير الملف في المتصفح
  const encryptedBlob = await WorkspaceEncryption.encryptFile(
    file, 
    workspaceKey.public_key
  )
  
  // 3. رفع الملف المشفر
  const fileName = `${contractId}_admin_encrypted.bin`
  const { error } = await supabase.storage
    .from('id-cards-encrypted')
    .upload(fileName, encryptedBlob)
  
  if (error) throw error
  
  toast.success('تم التشفير والرفع بنجاح!')
}
```

### المرحلة 3: عرض الصور المشفرة

```typescript
// components/ui/encrypted-image.tsx

export function EncryptedImage({ 
  path, 
  accountId, 
  alt 
}: EncryptedImageProps) {
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const loadAndDecrypt = async () => {
      // 1. تحميل الصورة المشفرة
      const { data } = await supabase.storage
        .from('id-cards-encrypted')
        .download(path)
      
      if (!data) return
      
      // 2. جلب المفتاح الخاص من المتصفح
      const privateKey = await WorkspaceEncryption.getPrivateKey(accountId)
      if (!privateKey) {
        console.error('Private key not found!')
        return
      }
      
      // 3. فك التشفير
      const decrypted = await WorkspaceEncryption.decryptFile(
        data, 
        privateKey
      )
      
      if (!decrypted) return
      
      // 4. تحويل لـ URL
      const blob = new Blob([decrypted], { type: 'image/png' })
      const url = URL.createObjectURL(blob)
      setDecryptedUrl(url)
      setLoading(false)
    }
    
    loadAndDecrypt()
  }, [path, accountId])
  
  if (loading) return <Skeleton className="w-full h-48" />
  
  return decryptedUrl ? (
    <img src={decryptedUrl} alt={alt} />
  ) : (
    <div>Failed to decrypt</div>
  )
}
```

---

## 🎁 المزايا:

1. ✅ **ثقة كاملة**: المدراء يثقون أنك لا تقدر تشوف بياناتهم
2. ✅ **Marketing قوي**: "حتى نحن لا نستطيع الوصول لبياناتك"
3. ✅ **Compliance**: يلبي أعلى معايير GDPR/SOC2
4. ✅ **Competitive Edge**: ميزة تنافسية كبيرة

## ⚠️ التحديات:

1. ❌ **Lost Key = Lost Data**: لو المستخدم فقد المفتاح، البيانات راحت للأبد
2. ❌ **PDF/Email**: يحتاج فك تشفير في السيرفر (تعقيد)
3. ❌ **Performance**: التشفير/فك في المتصفح أبطأ
4. ❌ **Complexity**: الكود أصعب بكثير

---

## 💡 الحل الهجين (موصى به):

```
🔐 Zero-Knowledge للبيانات شديدة الحساسية:
- بطاقات الهوية
- صور التوقيعات
- مستندات سرية

🛡️ Server-Side للبيانات الأقل حساسية:
- الأسماء والهواتف (مشفرة في DB)
- المبالغ (محمية بـ RLS)
- البيانات التي تحتاج PDF/Email
```

---

## 🎯 السؤال:

**هل تريد تطبيق Zero-Knowledge الكامل؟**

1. ✅ نعم - طبق Zero-Knowledge للبطاقات والتوقيعات (موصى به)
2. ⚠️ لا - خلي كل شيء Server-Side Encryption
3. 🤔 اشرحلي أكتر عن الحل الهجين
