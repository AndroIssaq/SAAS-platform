"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { OnboardingForm, type OnboardingData } from "@/components/onboarding/onboarding-form"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { saveOnboardingData, getCurrentClient } from "@/lib/actions/onboarding"

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isComplete, setIsComplete] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    async function loadClient() {
      const client = await getCurrentClient()
      if (client) {
        setClientId(client.id)
        // Check if already completed
        if (client.onboarding_completed) {
          setIsComplete(true)
        }
      }
      setIsLoading(false)
    }
    loadClient()
  }, [])

  const handleComplete = async (data: OnboardingData) => {
    if (!clientId) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على بيانات العميل",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const result = await saveOnboardingData(clientId, data)

    if (result.error) {
      toast({
        title: "خطأ",
        description: result.error,
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    toast({
      title: "تم بنجاح",
      description: "تم حفظ بياناتك بنجاح. سنبدأ العمل على مشروعك قريباً!",
    })

    setIsComplete(true)
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">تم إكمال التأهيل بنجاح!</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            شكراً لك على تقديم جميع المعلومات المطلوبة. سيقوم فريقنا بمراجعة البيانات والبدء في العمل على مشروعك في أقرب
            وقت ممكن.
          </p>
          <Button size="lg" onClick={() => router.push("/client/dashboard")}>
            الذهاب إلى لوحة التحكم
          </Button>
        </div>
      </div>
    )
  }

  if (!clientId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted-foreground">لم يتم العثور على بيانات العميل</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">مرحباً بك في روبوويب</h1>
          <p className="text-lg text-muted-foreground">
            يرجى ملء النموذج التالي لمساعدتنا في فهم احتياجاتك وبدء العمل على مشروعك
          </p>
        </div>

        <OnboardingForm contractId={clientId} onComplete={handleComplete} />
      </div>
    </div>
  )
}
