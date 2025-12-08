"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReferralLinkCardProps {
  affiliateCode: string
}

export function ReferralLinkCard({ affiliateCode }: ReferralLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const [referralLink, setReferralLink] = useState(`/signup?ref=${affiliateCode}`)
  const { toast } = useToast()

  useEffect(() => {
    // Set the full URL only on client side to avoid hydration mismatch
    setReferralLink(`${window.location.origin}/signup?ref=${affiliateCode}`)
  }, [affiliateCode])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast({
        title: "تم النسخ!",
        description: "تم نسخ رابط الإحالة إلى الحافظة",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "خطأ",
        description: "فشل نسخ الرابط",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>رابط الإحالة الخاص بك</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input value={referralLink} readOnly className="font-mono text-sm" />
          <Button onClick={copyToClipboard} variant="outline" size="icon" className="shrink-0 bg-transparent">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">كود الإحالة الخاص بك:</p>
          <div className="flex items-center gap-2">
            <code className="px-3 py-2 bg-muted rounded-md font-mono text-lg font-bold">{affiliateCode}</code>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(affiliateCode)
                toast({ title: "تم النسخ!", description: "تم نسخ كود الإحالة" })
              }}
              variant="ghost"
              size="sm"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
