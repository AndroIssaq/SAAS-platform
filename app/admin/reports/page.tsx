import { getAdminReports } from "@/lib/actions/reports"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Users, FileText, Activity, Star, Mail, PieChart, BarChart2 } from "lucide-react"
import { ContractsByMonthChart, ContractsByStatusChart } from "@/components/admin/reports-charts"

export default async function AdminReportsPage() {
  const data = await getAdminReports()
  const { totals, contractsByStatus, contractsByMonth, topServices, affiliates, emails, projectUpdates } = data

  const totalEmails = emails.totalSent + emails.totalFailed
  const deliveryRate = totalEmails ? Math.round((emails.totalSent / totalEmails) * 100) : 0
  const failureRate = totalEmails ? Math.round((emails.totalFailed / totalEmails) * 100) : 0

  const maxStatusCount = contractsByStatus.length
    ? Math.max(...contractsByStatus.map((s) => s.count || 0), 1)
    : 1

  const maxMonthContracts = contractsByMonth.length
    ? Math.max(...contractsByMonth.map((m) => m.count || 0), 1)
    : 1

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">التقارير والتحليلات</h1>
        <p className="text-muted-foreground">
          نظرة عميقة على أداء المنصة: المستخدمين، العقود، الإيرادات، الشركاء، البريد، وتحديثات المشاريع.
        </p>
      </div>

      {/* Top KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              إجمالي المستخدمين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalUsers.toLocaleString("ar-EG")}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totals.totalClients.toLocaleString("ar-EG")} عميل • {totals.totalAffiliates.toLocaleString("ar-EG")} شريك
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              العقود
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalContracts.toLocaleString("ar-EG")}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totals.activeContracts.toLocaleString("ar-EG")} نشط • {totals.completedContracts.toLocaleString("ar-EG")} مكتمل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              إجمالي الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.totalRevenue.toLocaleString("ar-EG")} <span className="text-base">ج.م</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">قيمة العقود المسجلة في النظام</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              أداء الشركاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliates.totalAffiliates.toLocaleString("ar-EG")}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {affiliates.totalReferrals.toLocaleString("ar-EG")} إحالة • {affiliates.totalEarnings.toLocaleString("ar-EG")} ج.م أرباح
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1.2fr]">
        {/* Contracts over time */}
        <Card className="overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              العقود والإيرادات آخر ٦ شهور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ContractsByMonthChart data={contractsByMonth} />
          </CardContent>
        </Card>

        {/* Contracts by status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              العقود حسب الحالة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ContractsByStatusChart data={contractsByStatus} totalContracts={totals.totalContracts} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1.2fr]">
        {/* Top services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              أفضل الخدمات أداءً
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topServices.length === 0 && (
              <p className="text-sm text-muted-foreground">لا توجد بيانات كافية عن الخدمات حتى الآن.</p>
            )}
            {topServices.map((service) => (
              <div
                key={service.service_type}
                className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-sm">{service.service_type}</span>
                  <span className="text-xs text-muted-foreground">
                    {service.contractsCount.toLocaleString("ar-EG")} عقد •
                    {" "}
                    {service.totalAmount.toLocaleString("ar-EG")} ج.م
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {service.contractsCount} عقد
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Affiliates performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              أداء الشركاء التسويقيين
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">عدد الشركاء</p>
                <p className="text-lg font-semibold">{affiliates.totalAffiliates.toLocaleString("ar-EG")}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">إجمالي الإحالات</p>
                <p className="text-lg font-semibold">{affiliates.totalReferrals.toLocaleString("ar-EG")}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">إجمالي الأرباح</p>
                <p className="text-lg font-semibold">
                  {affiliates.totalEarnings.toLocaleString("ar-EG")} ج.م
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">أرباح معلّقة</p>
                <p className="text-lg font-semibold">
                  {affiliates.pendingEarnings.toLocaleString("ar-EG")} ج.م
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">إجمالي المدفوعات للشركاء</p>
                <p className="text-lg font-semibold">
                  {affiliates.totalPayouts.toLocaleString("ar-EG")} ج.م
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Emails performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              أداء البريد الإلكتروني
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">المرسلة</p>
                <p className="text-lg font-semibold">{emails.totalSent.toLocaleString("ar-EG")}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">فشلت</p>
                <p className="text-lg font-semibold text-destructive">
                  {emails.totalFailed.toLocaleString("ar-EG")}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">آخر 30 يوم</p>
                <p className="text-lg font-semibold">{emails.last30DaysSent.toLocaleString("ar-EG")}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">معدلات التسليم</p>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${deliveryRate}%` }}
                />
                <div
                  className="h-full bg-destructive"
                  style={{ width: `${failureRate}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>نجاح: {deliveryRate}%</span>
                <span>فشل: {failureRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              تحديثات المشاريع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">إجمالي التحديثات</p>
                <p className="text-lg font-semibold">
                  {projectUpdates.totalUpdates.toLocaleString("ar-EG")}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">تحديثات غير مقروءة</p>
                <p className="text-lg font-semibold text-amber-600">
                  {projectUpdates.unreadUpdates.toLocaleString("ar-EG")}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              تساعدك هذه الأرقام على مراقبة تواصل فريقك مع العملاء والتأكد من متابعة كل تحديث.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
