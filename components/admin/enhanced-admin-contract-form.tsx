"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { EnhancedContractForm as AffiliateForm } from "@/components/affiliate/enhanced-contract-form"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

// Admin version - gets current admin user ID and handles success navigation
export function EnhancedContractForm({
  providerCompanyName,
  providerName
}: {
  providerCompanyName?: string
  providerName?: string
}) {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUserId(user.id)
      setLoading(false)
    }

    getUser()
  }, [router])

  const handleSuccess = (data: any) => {
    console.log("✅ Contract created successfully:", data)

    // Show success toast
    toast.success("تم إنشاء العقد بنجاح!", {
      description: data.contract_number ? `رقم العقد: ${data.contract_number}` : undefined,
    })

    // Navigate to contract page
    // Navigate to contract page
    const contractId = data.contractId || data.id
    if (contractId) {
      console.log("🚀 Navigating to:", `/admin/contracts/${contractId}/flow`)
      router.push(`/admin/contracts/${contractId}/flow`)
    } else {
      console.warn("⚠️ No contract ID returned, redirecting to contracts list")
      router.push("/admin/contracts")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!userId) {
    return null
  }

  return (
    <AffiliateForm
      affiliateId={userId}
      userRole="admin"
      onSuccess={handleSuccess}
      providerCompanyName={providerCompanyName}
      providerName={providerName}
    />
  )
}
