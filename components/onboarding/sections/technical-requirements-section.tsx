"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { X } from "lucide-react"
import type { OnboardingData } from "../onboarding-form"

interface TechnicalRequirementsSectionProps {
  data: Partial<OnboardingData>
  onChange: (data: Partial<OnboardingData>) => void
}

const availableIntegrations = [
  "بوابة دفع (Stripe, PayPal)",
  "تكامل مع WhatsApp",
  "تكامل مع Instagram",
  "Google Analytics",
  "Facebook Pixel",
  "نظام إدارة محتوى (CMS)",
  "نظام حجوزات",
  "متجر إلكتروني",
]

export function TechnicalRequirementsSection({ data, onChange }: TechnicalRequirementsSectionProps) {
  const addDomain = () => {
    const domains = data.domains || []
    onChange({ domains: [...domains, ""] })
  }

  const updateDomain = (index: number, value: string) => {
    const domains = [...(data.domains || [])]
    domains[index] = value
    onChange({ domains })
  }

  const removeDomain = (index: number) => {
    const domains = [...(data.domains || [])]
    domains.splice(index, 1)
    onChange({ domains })
  }

  const toggleIntegration = (integration: string) => {
    const integrations = data.integrations || []
    if (integrations.includes(integration)) {
      onChange({ integrations: integrations.filter((i) => i !== integration) })
    } else {
      onChange({ integrations: [...integrations, integration] })
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>النطاقات (Domains)</Label>
        <p className="text-sm text-muted-foreground">أضف النطاقات التي تملكها أو تريد استخدامها</p>
        <div className="space-y-2">
          {(data.domains || []).map((domain, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={domain}
                onChange={(e) => updateDomain(index, e.target.value)}
                placeholder="example.com"
                className="flex-1"
              />
              <Button variant="ghost" size="sm" onClick={() => removeDomain(index)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addDomain} className="w-full bg-transparent">
            إضافة نطاق
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hostingPreference">تفضيلات الاستضافة</Label>
        <Select value={data.hostingPreference || ""} onValueChange={(value) => onChange({ hostingPreference: value })}>
          <SelectTrigger id="hostingPreference" className="w-full">
            <SelectValue placeholder="اختر نوع الاستضافة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vercel">Vercel (موصى به)</SelectItem>
            <SelectItem value="shared">استضافة مشتركة</SelectItem>
            <SelectItem value="vps">VPS</SelectItem>
            <SelectItem value="dedicated">خادم مخصص</SelectItem>
            <SelectItem value="existing">لدي استضافة حالية</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>التكاملات المطلوبة</Label>
        <p className="text-sm text-muted-foreground">اختر الخدمات التي تريد دمجها</p>
        <div className="space-y-3">
          {availableIntegrations.map((integration) => (
            <div key={integration} className="flex items-center gap-2">
              <Checkbox
                id={integration}
                checked={(data.integrations || []).includes(integration)}
                onCheckedChange={() => toggleIntegration(integration)}
              />
              <Label htmlFor={integration} className="cursor-pointer">
                {integration}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="technicalNotes">ملاحظات تقنية إضافية</Label>
        <Textarea
          id="technicalNotes"
          value={data.technicalNotes || ""}
          onChange={(e) => onChange({ technicalNotes: e.target.value })}
          placeholder="أي متطلبات تقنية خاصة أو ملاحظات..."
          rows={4}
        />
      </div>
    </div>
  )
}
