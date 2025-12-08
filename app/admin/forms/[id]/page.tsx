import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Code2, Sparkles } from "lucide-react"
import { FormBuilder } from "@/components/admin/form-builder"
import { getFormById, updateForm } from "@/lib/actions/forms"
import type { FormConfig } from "@/lib/types/forms"

async function updateFormAction(id: string, formData: FormData) {
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

  const result = await updateForm({
    id,
    title,
    description: typeof description === "string" && description.trim() ? description.trim() : undefined,
    config,
  })

  if (!result.success) {
    redirect(`/admin/forms/${id}?error=${encodeURIComponent(result.error || "فشل في تحديث الفورم")}`)
  }

  revalidatePath("/admin/forms")
  revalidatePath(`/admin/forms/${id}`)
  redirect("/admin/forms")
}

interface EditFormPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditFormPage(props: EditFormPageProps) {
  const { id } = await props.params
  const result = await getFormById(id)

  if (!result.success || !result.form) {
    notFound()
  }

  const form = result.form

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
              تعديل الفورم
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </CardTitle>
            <CardDescription className="text-base mt-2">
              قم بتعديل الحقول والتصميم وإعدادات التضمين للفورم: {form.title}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <FormBuilder
        action={updateFormAction.bind(null, form.id)}
        initial={{
          title: form.title,
          description: form.description,
          config: form.config,
        }}
      />
    </div>
  )
}
