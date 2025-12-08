import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getAccountBillingInfo, getAvailablePlans, updateAccountPlan } from "@/lib/actions/billing"
import { ThemeToggle } from "@/components/settings/theme-toggle"
import { WorkspaceEncryptionCard } from "@/components/settings/workspace-encryption-card"

export default async function AdminSettingsPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "غير مضبوط"
  const hasResend = !!process.env.RESEND_API_KEY

  const billingInfo = await getAccountBillingInfo()
  const plans = await getAvailablePlans()

  const currentPlanCode = billingInfo.success ? billingInfo.planCode : "free"
  const planLabel = billingInfo.success ? billingInfo.planLabel : "الخطة المجانية / غير محددة"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إعدادات عَقدي</h1>
          <p className="text-muted-foreground text-sm mt-1">
            ضبط الإعدادات العامة لمنصة عَقدي: العلامة التجارية، البريد، الفورمز وغيرها.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Branding */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>العلامة التجارية (Branding)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">اسم النظام</span>
              <span className="font-medium">عَقدي - منصة إدارة العقود والعملاء</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">رابط المنصة (SITE URL)</span>
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                {siteUrl}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              يتم استخدام هذا الرابط في أكواد التضمين (Embed) للفورمز وفي بعض الروابط الخارجية. تأكد من ضبط
              <span className="font-mono mx-1">NEXT_PUBLIC_SITE_URL</span>
              في متغيرات البيئة.
            </p>
          </CardContent>
        </Card>

        {/* Appearance / Theme */}
        <Card>
          <CardHeader>
            <CardTitle>إعدادات المظهر والوضع</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeToggle />
          </CardContent>
        </Card>

        {/* Workspace Encryption */}
        <WorkspaceEncryptionCard />

        {/* Email / Resend */}
        <Card>
          <CardHeader>
            <CardTitle>إعدادات البريد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">حالة تكوين Resend</span>
              {hasResend ? (
                <Badge variant="default">مُفعّل</Badge>
              ) : (
                <Badge variant="destructive">غير مضبوط</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              يتم استخدام Resend لإرسال الإيميلات من لوحة التحكم (البريد الجماعي، فورمز الاشتراك، إشعارات العقود).
              تأكد من إضافة مفتاح API في متغير البيئة
              <span className="font-mono mx-1">RESEND_API_KEY</span>.
            </p>
          </CardContent>
        </Card>

        {/* Billing / Plan */}
        <Card>
          <CardHeader>
            <CardTitle>الاشتراك والخطة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">الخطة الحالية لمساحة العمل</span>
              <Badge variant="outline">{planLabel}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              يتم تحديد الخطة عند إنشاء الحساب من صفحة التسعير. يمكن لاحقًا ربط هذه الخطة بنظام دفع (Stripe أو غيره)
              لإدارة الاشتراكات والترقيات بشكل آلي.
            </p>
            <form action={updateAccountPlan} className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <select
                  name="plan"
                  defaultValue={currentPlanCode}
                  className="flex-1 rounded-md border bg-background px-2 py-1 text-xs"
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  تحديث الخطة
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                يتم تغيير الخطة هنا بشكل يدوي فقط (بدون خصم آلي). عند ربط بوابة دفع سيتم ضبط الخطط والمدفوعات آليًا.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Forms / Embeds */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>إعدادات الفورمز والتضمين</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground text-sm">
              إعدادات التضمين التفصيلية (الوضع inline / popup، العرض، تأخير البوب‑أب، ارتفاعه) يتم التحكم فيها على مستوى
              كل فورم من صفحة <span className="font-mono">/admin/forms</span>.
            </p>
            <p className="text-xs text-muted-foreground">
              لعرض فورم بشكل Popup في أي صفحة خارجية، استخدم كود التضمين من صفحة الفورم وتأكد من تحديد خواص
              <span className="font-mono mx-1">data-mode</span>,
              <span className="font-mono mx-1">data-delay</span>,
              <span className="font-mono mx-1">data-popup-once</span>
              حسب ما يناسبك.
            </p>
          </CardContent>
        </Card>

        {/* Info card */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات النظام</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">لغة الواجهة</span>
              <span className="font-medium">العربية (RTL)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">الخط الأساسي</span>
              <span className="font-medium">Tajawal</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              يمكن تعديل إعدادات التصميم المتقدمة (الألوان، الخطوط) من خلال تحديث مكونات الواجهة وملف
              <span className="font-mono mx-1">globals.css</span> حسب الحاجة.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
