"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FormConfig, FormField } from "@/lib/types/forms"

interface FormRuntimeProps {
  config: FormConfig
  formKey: string
  preview?: boolean
}

export function FormRuntime({ config, formKey, preview = false }: FormRuntimeProps) {
  const { fields, theme } = config
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (preview) {
      e.preventDefault()
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 2000)
    }
  }

  const radiusMap: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-2xl",
    full: "rounded-3xl",
  }

  const sizeMap: Record<string, string> = {
    sm: "text-sm py-1.5 px-3",
    md: "text-sm py-2 px-4",
    lg: "text-base py-3 px-6",
  }

  const cardRadius = radiusMap[theme.radius] || radiusMap.md
  const buttonClasses = `${sizeMap[theme.size] || sizeMap.md} ${cardRadius}`

  const renderField = (field: FormField) => {
    const baseProps = {
      id: field.name,
      name: field.name,
      required: field.required,
      placeholder: field.placeholder,
    }

    switch (field.type) {
      case "textarea":
        return <Textarea {...baseProps} rows={4} />
      case "select":
        return (
          <Select required={field.required} name={field.name}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "اختر"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <Checkbox id={field.name} name={field.name} required={field.required} />
            <Label htmlFor={field.name} className="text-sm text-muted-foreground">
              {field.label}
            </Label>
          </div>
        )
      case "phone":
        return <Input {...baseProps} type="tel" />
      case "email":
        return <Input {...baseProps} type="email" />
      case "text":
      default:
        return <Input {...baseProps} type="text" />
    }
  }

  const publicTitle = theme.publicTitle || "نموذج اشتراك"
  const publicSubtitle = theme.publicSubtitle || "املأ البيانات وسنتواصل معك قريبًا"
  const layout = theme.layout || "stacked"
  const hasImage = !!theme.imageUrl && layout === "split"
  const imagePosition = (theme as any).imagePosition || "right"

  const spacing = (theme as any).spacing || "normal"

  const headerPaddingClass =
    spacing === "compact"
      ? "px-4 pt-3 pb-2"
      : spacing === "comfortable"
      ? "px-6 pt-6 pb-4"
      : "px-5 pt-5 pb-4"

  const contentPaddingClass =
    spacing === "compact"
      ? "px-4 pb-4 pt-0"
      : spacing === "comfortable"
      ? "px-6 pb-6 pt-0"
      : "px-5 pb-5 pt-0"

  const fieldsGapClass =
    spacing === "compact" ? "space-y-3" : spacing === "comfortable" ? "space-y-6" : "space-y-4"

  const titleAlign = (theme as any).titleAlign || "right"
  const titleAlignClass = titleAlign === "center" ? "text-center" : "text-right"

  const buttonAlign = (theme as any).buttonAlign || "stretch"
  const buttonWrapperClass =
    buttonAlign === "right"
      ? "pt-4 flex flex-col items-end gap-2"
      : buttonAlign === "center"
      ? "pt-4 flex flex-col items-center gap-2"
      : "pt-4 flex flex-col gap-2"
  const buttonWidthClass = buttonAlign === "stretch" ? "w-full" : "w-auto min-w-[160px]"

  return (
    <div
      className={`w-full flex justify-center ${theme.background === "dark" ? "bg-slate-900/80" : "bg-transparent"}`}
    >
      <Card
        className={`w-full max-w-4xl shadow-lg border-primary/10 ${cardRadius}`}
        style={{
          background:
            theme.cardBackgroundColor && theme.cardBackgroundColor.trim().length > 0
              ? theme.cardBackgroundColor
              : "linear-gradient(to bottom right, rgba(16,185,129,0.06), var(--background))",
        }}
      >
        <CardHeader className={headerPaddingClass}>
          <div className="flex items-center justify-between gap-2">
            <div className={`space-y-1 ${titleAlignClass}`}>
              <h2 className="text-2xl font-semibold leading-tight">{publicTitle}</h2>
              {publicSubtitle && (
                <p className="text-sm text-muted-foreground max-w-xl">{publicSubtitle}</p>
              )}
            </div>
            {preview && (
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-300">
                معاينة
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className={contentPaddingClass}>
          <div className={hasImage ? "grid grid-cols-2 gap-6 items-stretch" : "flex flex-col"}>
            {hasImage && (
              <div className={`relative ${imagePosition === "right" ? "order-2" : "order-1"}`}>
                <div className={`h-full w-full overflow-hidden ${cardRadius}`}>
                  {/* نستخدم img عادية لتجنب إعدادات Next/Image هنا */}
                  <img src={theme.imageUrl} alt={publicTitle} className="h-full w-full object-cover" />
                </div>
              </div>
            )}

            <div className={hasImage ? (imagePosition === "right" ? "order-1" : "order-2") : undefined}>
              <form
                dir="rtl"
                className={fieldsGapClass}
                method="POST"
                action={preview ? undefined : "/api/forms/submit"}
                onSubmit={handleSubmit}
              >
                <input type="hidden" name="form_key" value={formKey} />
                {fields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    {field.type !== "checkbox" && (
                      <Label htmlFor={field.name} className="text-sm font-medium">
                        {field.label}
                        {field.required && <span className="text-red-500 mr-1">*</span>}
                      </Label>
                    )}
                    {renderField(field)}
                  </div>
                ))}

                <div className={buttonWrapperClass}>
                  <Button
                    type="submit"
                    className={`${buttonClasses} ${buttonWidthClass} text-white`}
                    style={{ backgroundColor: theme.primaryColor, borderColor: theme.primaryColor }}
                  >
                    {preview ? "إرسال تجريبي" : theme.submitLabel}
                  </Button>
                  {submitted && preview && (
                    <p className="text-xs text-center text-muted-foreground">
                      تم إرسال المعاينة (لا يتم حفظ أي بيانات).
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
