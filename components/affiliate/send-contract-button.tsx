"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface SendContractButtonProps {
  contractId: string
  contractNumber: string
}

export function SendContractButton({ contractId, contractNumber }: SendContractButtonProps) {
  const [isSending, setIsSending] = useState(false)
  const router = useRouter()

  const handleSend = async () => {
    setIsSending(true)
    
    try {
      // Here you can add logic to send contract to client
      // For now, just show success message
      toast.success("تم إرسال العقد للعميل بنجاح")
      
      // Redirect to contract flow
      router.push(`/affiliate/contracts/${contractId}/flow`)
    } catch (error) {
      toast.error("فشل في إرسال العقد")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Button
      onClick={handleSend}
      disabled={isSending}
      size="lg"
      className="gap-2"
    >
      {isSending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          جاري الإرسال...
        </>
      ) : (
        <>
          <Send className="h-5 w-5" />
          إرسال العقد للعميل
        </>
      )}
    </Button>
  )
}
