import { notFound } from "next/navigation"
import { getFormByKey } from "@/lib/actions/forms"
import { FormRuntime } from "@/components/forms/form-runtime"

interface PublicFormPageProps {
  params: Promise<{
    formKey: string
  }>
  searchParams: Promise<{
    embed?: string
  }>
}

export default async function PublicFormPage(props: PublicFormPageProps) {
  const [{ formKey }, resolvedSearchParams] = await Promise.all([props.params, props.searchParams])
  const result = await getFormByKey(formKey)

  if (!result.success || !result.form) {
    notFound()
  }

  const form = result.form
  const isEmbed = resolvedSearchParams?.embed === "1"

  // Default config if form doesn't have one (forms-builder uses blocks instead)
  const defaultConfig = {
    fields: [
      { id: '1', name: 'name', label: 'الاسم', type: 'text' as const, required: true, placeholder: 'أدخل اسمك' },
      { id: '2', name: 'email', label: 'البريد الإلكتروني', type: 'email' as const, required: true, placeholder: 'example@email.com' },
    ],
    theme: {
      publicTitle: form.name || 'نموذج اشتراك',
      publicSubtitle: 'املأ البيانات وسنتواصل معك قريبًا',
      primaryColor: '#10b981',
      submitLabel: 'إرسال',
      radius: 'md' as const,
      size: 'md' as const,
      background: 'light' as const,
      layout: 'stacked' as const,
    }
  }

  const config = form.config || defaultConfig

  if (isEmbed) {
    return (
      <div className="flex items-center justify-center bg-transparent px-0 py-0">
        <FormRuntime config={config} formKey={form.id} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-10">
      <FormRuntime config={config} formKey={form.id} />
    </div>
  )
}
