"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormRuntime } from "@/components/forms/form-runtime"
import type {
  FormConfig,
  FormField,
  FormFieldType,
  FormThemeRadius,
  FormThemeSize,
  FormThemeLayout,
} from "@/lib/types/forms"
import { PlusCircle, Trash2, Palette, LayoutTemplate, Code2, Mail } from "lucide-react"
import { useFormStatus } from "react-dom"

interface FormBuilderInitialValues {
  title?: string
  description?: string | null
  config?: FormConfig
}

interface FormBuilderProps {
  action: (formData: FormData) => void | Promise<void>
  initial?: FormBuilderInitialValues
}

const defaultConfig: FormConfig = {
  fields: [
    {
      id: "full_name",
      type: "text",
      name: "full_name",
      label: "الاسم الكامل",
      placeholder: "اكتب اسمك هنا",
      required: true,
    },
    {
      id: "email",
      type: "email",
      name: "email",
      label: "البريد الإلكتروني",
      placeholder: "you@example.com",
      required: true,
      isPrimaryEmail: true,
    },
  ],
  theme: {
    primaryColor: "#10b981",
    background: "light",
    radius: "lg",
    size: "md",
    submitLabel: "إرسال",
    publicTitle: "اشترك الآن واحصل على عرض خاص",
    publicSubtitle: "املأ بياناتك وسنقوم بالتواصل معك في أقرب وقت",
    layout: "stacked",
    imageUrl: "",
    imagePosition: "right",
  },
  embed: {
    mode: "inline",
    maxWidth: 480,
    popupDelayMs: 2000,
    popupOncePerSession: true,
    popupHeightVh: 80,
  },
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full md:w-auto min-w-[160px]">
      {pending ? "جارٍ الحفظ..." : "حفظ الفورم"}
    </Button>
  )
}

export function FormBuilder({ action, initial }: FormBuilderProps) {
  const initialConfig = initial?.config || defaultConfig
  const initialTitle = initial?.title || "نموذج اشتراك جديد"
  const initialDescription = initial?.description || ""

  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [config, setConfig] = useState<FormConfig>(initialConfig)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(initialConfig.fields[0]?.id || null)

  const addField = (type: FormFieldType) => {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const base: FormField = {
      id,
      type,
      name: id,
      label: "حقل جديد",
      required: false,
      placeholder: type === "textarea" ? "اكتب هنا" : "",
    }
    if (type === "select") {
      base.options = [
        { value: "option1", label: "اختيار 1" },
        { value: "option2", label: "اختيار 2" },
      ]
    }
    setConfig((prev) => ({ ...prev, fields: [...prev.fields, base] }))
    setSelectedFieldId(id)
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((field) => (field.id === id ? { ...field, ...updates } : field)),
    }))
  }

  const removeField = (id: string) => {
    setConfig((prev) => ({ ...prev, fields: prev.fields.filter((f) => f.id !== id) }))
    if (selectedFieldId === id) setSelectedFieldId(null)
  }

  const setPrimaryEmailField = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((field) => ({ ...field, isPrimaryEmail: field.id === id })),
    }))
  }

  const handleThemeChange = (key: keyof FormConfig["theme"], value: any) => {
    setConfig((prev) => ({ ...prev, theme: { ...prev.theme, [key]: value } }))
  }

  const handleEmbedChange = (key: keyof FormConfig["embed"], value: any) => {
    setConfig((prev) => ({ ...prev, embed: { ...prev.embed, [key]: value } }))
  }

  const selectedField = config.fields.find((f) => f.id === selectedFieldId) || config.fields[0] || null

  const radiusOptions: { value: FormThemeRadius; label: string }[] = [
    { value: "sm", label: "صغيرة" },
    { value: "md", label: "متوسطة" },
    { value: "lg", label: "كبيرة" },
    { value: "full", label: "دائرية" },
  ]

  const sizeOptions: { value: FormThemeSize; label: string }[] = [
    { value: "sm", label: "صغير" },
    { value: "md", label: "متوسط" },
    { value: "lg", label: "كبير" },
  ]

  const layoutOptions: { value: FormThemeLayout; label: string }[] = [
    { value: "stacked", label: "العناصر فوق بعض" },
    { value: "split", label: "صورة + فورم جنب بعض" },
  ]

  const colorPresets: { primary: string; card: string }[] = [
    { primary: "#10b981", card: "#ecfdf5" },
    { primary: "#3b82f6", card: "#eff6ff" },
    { primary: "#8b5cf6", card: "#f5f3ff" },
    { primary: "#ef4444", card: "#fef2f2" },
    { primary: "#f97316", card: "#fff7ed" },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <form action={action} className="space-y-6">
        <input type="hidden" name="config" value={JSON.stringify(config)} />

        <Card>
          <CardHeader>
            <CardTitle>معلومات الفورم</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان الفورم</Label>
              <Input
                id="title"
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: فورم اشتراك النشرة البريدية"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">وصف مختصر</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="هذا الوصف يظهر داخل لوحة التحكم فقط"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5" />
              إعدادات الفورم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="fields" className="space-y-4">
              <TabsList className="grid grid-cols-3 w-full md:w-auto">
                <TabsTrigger value="fields">الحقول</TabsTrigger>
                <TabsTrigger value="style" className="flex items-center gap-1">
                  <Palette className="h-4 w-4" />
                  <span>التصميم</span>
                </TabsTrigger>
                <TabsTrigger value="embed" className="flex items-center gap-1">
                  <Code2 className="h-4 w-4" />
                  <span>التضمين</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="fields" className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => addField("text")}>
                    <PlusCircle className="h-4 w-4 ml-1" /> حقل نص
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addField("email")}>
                    <PlusCircle className="h-4 w-4 ml-1" /> بريد إلكتروني
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addField("phone")}>
                    <PlusCircle className="h-4 w-4 ml-1" /> رقم جوال
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addField("textarea")}>
                    <PlusCircle className="h-4 w-4 ml-1" /> نص متعدد الأسطر
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addField("select")}>
                    <PlusCircle className="h-4 w-4 ml-1" /> قائمة اختيار
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addField("checkbox")}>
                    <PlusCircle className="h-4 w-4 ml-1" /> Checkbox
                  </Button>
                </div>

                <div className="grid md:grid-cols-[220px_minmax(0,1fr)] gap-4 mt-4">
                  <div className="space-y-2 border rounded-lg p-3 max-h-80 overflow-y-auto">
                    {config.fields.map((field) => (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => setSelectedFieldId(field.id)}
                        className={`w-full text-right px-3 py-2 rounded-md text-sm border flex items-center justify-between gap-2 ${
                          selectedFieldId === field.id ? "border-primary bg-primary/5" : "border-muted hover:bg-muted/50"
                        }`}
                      >
                        <span className="truncate">{field.label || field.name}</span>
                        <span className="text-[11px] text-muted-foreground">{field.type}</span>
                      </button>
                    ))}
                    {config.fields.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">لا توجد حقول بعد، أضف حقلاً جديداً من الأعلى.</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {selectedField ? (
                      <>
                        <div className="flex items-center justify-between">
                          <Label>إعدادات الحقل</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeField(selectedField.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>التسمية (Label)</Label>
                            <Input
                              value={selectedField.label}
                              onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>اسم الحقل (name)</Label>
                            <Input
                              value={selectedField.name}
                              onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>نوع الحقل</Label>
                          <Select
                            value={selectedField.type}
                            onValueChange={(value) => updateField(selectedField.id, { type: value as FormFieldType })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">نص</SelectItem>
                              <SelectItem value="email">بريد إلكتروني</SelectItem>
                              <SelectItem value="phone">رقم جوال</SelectItem>
                              <SelectItem value="textarea">نص متعدد الأسطر</SelectItem>
                              <SelectItem value="select">قائمة اختيار</SelectItem>
                              <SelectItem value="checkbox">Checkbox</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedField.type !== "checkbox" && (
                          <div className="space-y-1.5">
                            <Label>Placeholder</Label>
                            <Input
                              value={selectedField.placeholder || ""}
                              onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                            />
                          </div>
                        )}
                        {selectedField.type === "select" && (
                          <div className="space-y-1.5">
                            <Label>خيارات القائمة (كل خيار في سطر)</Label>
                            <Textarea
                              rows={3}
                              value={(selectedField.options || []).map((o) => o.label).join("\n")}
                              onChange={(e) => {
                                const lines = e.target.value.split("\n").filter((l) => l.trim())
                                updateField(selectedField.id, {
                                  options: lines.map((line, idx) => ({
                                    value: `opt_${idx + 1}`,
                                    label: line,
                                  })),
                                })
                              }}
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={!!selectedField.required}
                              onCheckedChange={(checked) => updateField(selectedField.id, { required: checked })}
                            />
                            <Label className="text-sm">هذا الحقل إجباري</Label>
                          </div>
                          {selectedField.type === "email" && (
                            <button
                              type="button"
                              onClick={() => setPrimaryEmailField(selectedField.id)}
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Mail className="h-3 w-3" />
                              اعتباره حقل الإيميل الرئيسي
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">اختر حقلاً من القائمة لتعديل إعداداته.</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="style" className="space-y-4">
                <div className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>اللون الأساسي (hex)</Label>
                      <Input
                        value={config.theme.primaryColor}
                        onChange={(e) => handleThemeChange("primaryColor", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>لون خلفية الكرت (hex)</Label>
                      <Input
                        value={config.theme.cardBackgroundColor || ""}
                        onChange={(e) => handleThemeChange("cardBackgroundColor", e.target.value)}
                        placeholder="#ecfdf5"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-muted-foreground">لوحات ألوان جاهزة:</span>
                    {colorPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setConfig((prev) => ({
                            ...prev,
                            theme: {
                              ...prev.theme,
                              primaryColor: preset.primary,
                              cardBackgroundColor: preset.card,
                            },
                          }))
                        }}
                        className="flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] hover:bg-muted/60"
                      >
                        <span
                          className="inline-block h-3 w-3 rounded-full border"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span
                          className="inline-block h-3 w-3 rounded-full border"
                          style={{ backgroundColor: preset.card }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>حجم العناصر</Label>
                    <Select
                      value={config.theme.size}
                      onValueChange={(value) => handleThemeChange("size", value as FormThemeSize)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sizeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>استدارة الحواف</Label>
                    <Select
                      value={config.theme.radius}
                      onValueChange={(value) => handleThemeChange("radius", value as FormThemeRadius)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {radiusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>العنوان الذي يظهر فوق الفورم</Label>
                    <Input
                      value={config.theme.publicTitle || ""}
                      onChange={(e) => handleThemeChange("publicTitle", e.target.value)}
                      placeholder={title}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>وصف قصير يظهر تحت العنوان</Label>
                    <Textarea
                      rows={2}
                      value={config.theme.publicSubtitle || ""}
                      onChange={(e) => handleThemeChange("publicSubtitle", e.target.value)}
                      placeholder="سطر يشرح العرض أو سبب الاشتراك"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>تخطيط الفورم</Label>
                    <Select
                      value={config.theme.layout || "stacked"}
                      onValueChange={(value) => handleThemeChange("layout", value as FormThemeLayout)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {layoutOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>رابط الصورة الجانبية (اختياري)</Label>
                    <Input
                      value={config.theme.imageUrl || ""}
                      onChange={(e) => handleThemeChange("imageUrl", e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  {config.theme.layout === "split" && (
                    <div className="space-y-1.5">
                      <Label>مكان الصورة</Label>
                      <Select
                        value={config.theme.imagePosition || "right"}
                        onValueChange={(value) => handleThemeChange("imagePosition", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="right">الصورة يمين والحقول يسار</SelectItem>
                          <SelectItem value="left">الصورة يسار والحقول يمين</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config.theme.background === "dark"}
                    onCheckedChange={(checked) => handleThemeChange("background", checked ? "dark" : "light")}
                  />
                  <Label className="text-sm">خلفية داكنة حول الفورم</Label>
                </div>
              </TabsContent>

              <TabsContent value="embed" className="space-y-4">
                <div className="space-y-2">
                  <Label>وضع التضمين</Label>
                  <Select
                    value={config.embed.mode}
                    onValueChange={(value) => handleEmbedChange("mode", value as FormConfig["embed"]["mode"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inline">قسم داخل الصفحة (Section)</SelectItem>
                      <SelectItem value="popup">Popup يظهر عند الدخول</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>الحد الأقصى للعرض (px)</Label>
                    <Input
                      type="number"
                      value={config.embed.maxWidth || 480}
                      onChange={(e) => handleEmbedChange("maxWidth", Number(e.target.value) || 480)}
                    />
                  </div>
                  {config.embed.mode === "popup" && (
                    <>
                      <div className="space-y-1.5">
                        <Label>تأخير ظهور الـPopup (ms)</Label>
                        <Input
                          type="number"
                          value={config.embed.popupDelayMs || 2000}
                          onChange={(e) => handleEmbedChange("popupDelayMs", Number(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>ارتفاع البوب‑أب (% من ارتفاع الشاشة)</Label>
                        <Input
                          type="number"
                          value={config.embed.popupHeightVh || 80}
                          onChange={(e) => handleEmbedChange("popupHeightVh", Number(e.target.value) || 80)}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={!!config.embed.popupOncePerSession}
                          onCheckedChange={(checked) => handleEmbedChange("popupOncePerSession", checked)}
                        />
                        <Label className="text-sm">عرض الـPopup مرة واحدة لكل جلسة</Label>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  سيتم استخدام هذه الإعدادات لتوليد كود التضمين (Embed Code) الذي يمكنك نسخه ووضعه في أي موقع أو Landing Page.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <SaveButton />
        </div>
      </form>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>معاينة الفورم</span>
            <span className="text-xs text-muted-foreground">التغييرات تظهر هنا مباشرة</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormRuntime config={config} formKey="preview-form" preview />
        </CardContent>
      </Card>
    </div>
  )
}
