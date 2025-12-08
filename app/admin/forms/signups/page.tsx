import Link from "next/link"
import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getFormSubmissions, type FormSubmissionRecord, sendEmailToFormSignups, deleteFormSubmission } from "@/lib/actions/forms"
import { Download, Filter, FormInput, Globe2, Mail } from "lucide-react"
import { SignupsEmailPanel } from "@/components/admin/form-signups-email-panel"
import { DeleteSignupButton } from "@/components/admin/delete-signup-button"

export const metadata: Metadata = {
  title: "إدارة Signups الفورمز",
}

async function sendBroadcastEmailAction(formKey: string, formData: FormData) {
  "use server"

  const subject = formData.get("subject")
  const message = formData.get("message")

  if (
    !formKey ||
    formKey === "all" ||
    typeof subject !== "string" ||
    typeof message !== "string" ||
    !subject.trim() ||
    !message.trim()
  ) {
    return { success: false, message: "يرجى ملء جميع الحقول المطلوبة" }
  }

  const result = await sendEmailToFormSignups({
    formKey,
    subject: subject.trim(),
    message: message.trim(),
  })

  if (result.success) {
    return { success: true, message: `تم إرسال الإيميل بنجاح إلى ${result.sentCount} مشترك` }
  }

  return { success: false, message: result.error || "فشل في الإرسال" }
}

async function deleteSignupAction(id: string) {
  "use server"

  await deleteFormSubmission(id)
}

function buildCsv(submissions: FormSubmissionRecord[]): string {
  if (!submissions.length) return ""

  const dynamicKeys = Array.from(
    new Set(
      submissions.flatMap((s) =>
        Object.keys((s.data || {}) as Record<string, any>).filter((k) => !["form_key", "email"].includes(k)),
      ),
    ),
  )

  const header = ["form_title", "form_key", "email", "source_url", "created_at", ...dynamicKeys]

  const escape = (value: unknown) => {
    if (value == null) return ""
    const str = String(value).replace(/"/g, '""')
    return `"${str}` + `"`
  }

  const rows = submissions.map((s) => {
    const base: (string | number)[] = [
      escape(s.form?.title),
      escape(s.form?.form_key),
      escape(s.email),
      escape(s.source_url),
      escape(new Date(s.created_at).toISOString()),
    ]

    const data: Record<string, any> = (s.data || {}) as Record<string, any>
    const dynamicValues = dynamicKeys.map((key) => escape(key in data ? data[key] : ""))

    return [...base, ...dynamicValues].join(",")
  })

  return [header.join(","), ...rows].join("\n")
}

interface PageProps {
  searchParams: Promise<{
    form?: string
  }>
}

export default async function FormSignupsPage(props: PageProps) {
  const resolvedSearchParams = await props.searchParams

  const { success, submissions, error } = await getFormSubmissions()
  const list = success ? submissions : []

  const formsMap = new Map<string, { title: string; form_key: string }>()
  for (const s of list) {
    if (s.form?.form_key && !formsMap.has(s.form.form_key)) {
      formsMap.set(s.form.form_key, {
        title: s.form.title,
        form_key: s.form.form_key,
      })
    }
  }

  const formKeyFilter = resolvedSearchParams?.form || "all"
  const filtered =
    formKeyFilter && formKeyFilter !== "all"
      ? list.filter((s) => s.form?.form_key === formKeyFilter)
      : list

  const total = list.length
  const uniqueFormsCount = formsMap.size

  const csv = buildCsv(filtered)
  const csvHref = csv
    ? `data:text/csv;charset=utf-8,${encodeURIComponent("\ufeff" + csv)}`
    : undefined

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ""

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">إدارة Signups الفورمز</h1>
          <p className="text-muted-foreground mt-2">
            عرض وتحليل كل signups القادمة من الفورمز المضمنة في المواقع والـ Landing Pages.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {csvHref && (
            <Button asChild variant="outline" size="sm">
              <a href={csvHref} download="form-signups.csv">
                <Download className="ml-2 h-4 w-4" />
                تصدير كـ CSV
              </a>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/forms">
              <FormInput className="ml-2 h-4 w-4" />
              إدارة الفورمز
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-primary" />
              إجمالي الـ signups
            </CardTitle>
            <CardDescription>
              {total} signup من خلال {uniqueFormsCount} فورم مختلفة.
            </CardDescription>
          </div>

          <form className="flex flex-wrap items-center gap-3" method="GET">
            <div className="flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span>فلترة حسب الفورم:</span>
            </div>
            <select
              name="form"
              defaultValue={formKeyFilter}
              className="border rounded-md px-3 py-1.5 text-sm bg-background"
            >
              <option value="all">كل الفورمز</option>
              {Array.from(formsMap.values()).map((form) => (
                <option key={form.form_key} value={form.form_key}>
                  {form.title}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" variant="outline">
              تطبيق الفلتر
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          <SignupsEmailPanel
            formKey={formKeyFilter !== "all" ? formKeyFilter : ""}
            signupCount={filtered.filter((s) => !!s.email).length}
            action={sendBroadcastEmailAction.bind(null, formKeyFilter)}
          />

          {!success && error && (
            <p className="text-sm text-destructive mb-4">حدث خطأ في جلب البيانات: {error}</p>
          )}

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              لا توجد بيانات signups بعد. قم بتضمين إحدى الفورمز في Landing Page وجرّب تسجيل اشتراك.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((s) => {
                const dataEntries = Object.entries((s.data || {}) as Record<string, any>)
                const previewEntries = dataEntries.slice(0, 4)
                const extraCount = dataEntries.length - previewEntries.length

                const publicUrl = s.form?.form_key
                  ? baseUrl
                    ? `${baseUrl}/forms/${s.form.form_key}`
                    : `/forms/${s.form.form_key}`
                  : null

                return (
                  <div
                    key={s.id}
                    className="p-4 rounded-lg border bg-card/50 flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <FormInput className="h-3 w-3" />
                          {s.form?.title || "فورم غير معروفة"}
                        </Badge>
                        {s.email && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {s.email}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        تم التسجيل في {new Date(s.created_at).toLocaleString("ar-EG")}
                        {s.source_url && (
                          <>
                            {" • من الصفحة: "}
                            <a
                              href={s.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline"
                            >
                              {s.source_url}
                            </a>
                          </>
                        )}
                      </p>
                      {publicUrl && (
                        <p className="text-[11px] text-muted-foreground">
                          رابط الفورم:
                          {" "}
                          <Link href={publicUrl} target="_blank" className="text-primary hover:underline">
                            {publicUrl}
                          </Link>
                        </p>
                      )}
                      <form action={deleteSignupAction.bind(null, s.id)} className="mt-2">
                        <DeleteSignupButton label="حذف هذا الـ signup" />
                      </form>
                    </div>

                    <div className="w-full md:w-1/2 text-xs bg-muted/40 rounded-md px-3 py-2 mt-2 md:mt-0">
                      {previewEntries.length === 0 ? (
                        <p className="text-muted-foreground">لا توجد حقول مسجلة في هذه العملية.</p>
                      ) : (
                        <dl className="space-y-1">
                          {previewEntries.map(([key, value]) => (
                            <div key={key} className="flex flex-col">
                              <dt className="text-[11px] text-muted-foreground">{key}</dt>
                              <dd className="font-medium break-words">{String(value)}</dd>
                            </div>
                          ))}
                          {extraCount > 0 && (
                            <p className="text-[11px] text-muted-foreground mt-1">+ {extraCount} حقل إضافي في الـ CSV.</p>
                          )}
                        </dl>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
