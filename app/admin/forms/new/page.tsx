import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, Code2 } from "lucide-react"
import { FormBuilder } from "@/components/admin/form-builder"
import { createForm } from "@/lib/actions/forms"
import type { FormConfig } from "@/lib/types/forms"

async function createFormAction(formData: FormData) {
  "use server"

  const title = formData.get("title")
  const description = formData.get("description")
  const configRaw = formData.get("config")

  if (!title || typeof title !== "string") {
    return
  }

  let config: FormConfig
  try {
    const json =
      typeof configRaw === "string"
        ? configRaw
        : typeof configRaw === "object" && configRaw !== null && "toString" in configRaw
        ? String(configRaw)
        : "{}"
    config = JSON.parse(json) as FormConfig
  } catch (err) {
    console.error("Failed to parse form config", err)
    return
  }

  const result = await createForm({
    title,
    description: typeof description === "string" && description.trim() ? description.trim() : undefined,
    config,
  })

  if (!result.success) {
    redirect(`/admin/forms/new?error=${encodeURIComponent(result.error || "فشل في إنشاء الفورم")}`)
  }

  revalidatePath("/admin/forms")
  redirect("/admin/forms")
}

export default async function NewFormPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/forms">
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للفورمز
          </Link>
        </Button>

        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-primary/10 rounded-full">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              إنشاء فورم اشتراك جديدة
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </CardTitle>
            <CardDescription className="text-base mt-2">
              قم ببناء فورم ديناميكية يمكن تضمينها في أي Landing Page أو موقع خارجي، مع تخصيص الحقول والتصميم بالكامل.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              بعد حفظ الفورم، ستحصل على رابط عام وكود تضمين (Embed Code) لعرضها كقسم داخل الصفحة أو كـ Popup مخصص.
            </p>
          </CardContent>
        </Card>
      </div>

      <FormBuilder action={createFormAction} />
    </div>
  )
}
