"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Code2, Copy, Check } from "lucide-react"

interface EmbedCodeSnippetProps {
  label: string
  code: string
}

export function EmbedCodeSnippet({ label, code }: EmbedCodeSnippetProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast({
        title: "تم النسخ!",
        description: "تم نسخ كود التضمين إلى الحافظة",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "خطأ",
        description: "فشل نسخ الكود",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Code2 className="h-3 w-3" />
          <span>{label}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <div className="rounded-md bg-muted px-3 py-2 font-mono break-all text-[11px]">{code}</div>
    </div>
  )
}
