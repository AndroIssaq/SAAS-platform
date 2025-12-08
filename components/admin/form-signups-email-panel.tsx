"use client"

import { useState, useRef } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, ChevronDown } from "lucide-react"
import { toast } from "sonner"

interface SignupsEmailPanelProps {
  formKey: string
  signupCount: number
  action: (formData: FormData) => Promise<any>
}

function SendButton({ signupCount }: { signupCount: number }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "جاري الإرسال..." : `إرسال الإيميل الآن (${signupCount})`}
    </Button>
  )
}

export function SignupsEmailPanel({ formKey, signupCount, action }: SignupsEmailPanelProps) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  if (!formKey || signupCount === 0) return null

  const handleAction = async (formData: FormData) => {
    try {
      const result = await action(formData)

      if (result && result.success) {
        toast.success(result.message || "تم الإرسال بنجاح")
        formRef.current?.reset()
        setOpen(false)
      } else {
        toast.error(result?.message || "فشل في الإرسال")
      }
    } catch (err) {
      toast.error("حدث خطأ غير متوقع")
    }
  }

  return (
    <div className="mb-6 rounded-xl border bg-muted/40 px-4 py-3 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 text-right"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium">
              إرسال إيميل لكل المشتركين في هذه الفورم
            </p>
            <p className="text-xs text-muted-foreground">
              سيتم إرسال نفس الرسالة إلى {signupCount} إيميل مرتبطة بالفورم ({formKey}).
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      <div
        className={`mt-3 overflow-hidden transition-all duration-300 ease-out ${open ? "max-h-[420px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1"
          }`}
      >
        {open && (
          <form ref={formRef} action={handleAction} className="space-y-3 pt-2">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium" htmlFor="subject">
                  عنوان الرسالة
                </label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="مثال: شكرًا لاشتراكك معنا"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" htmlFor="message">
                  نص الإيميل
                </label>
                <Textarea
                  id="message"
                  name="message"
                  rows={3}
                  placeholder={"نص الإيميل الذي سيتم إرساله لكل المشتركين في هذه الفورم"}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <SendButton signupCount={signupCount} />
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
