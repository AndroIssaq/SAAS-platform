"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { OnboardingData } from "../onboarding-form"

interface CompanyInfoSectionProps {
  data: Partial<OnboardingData>
  onChange: (data: Partial<OnboardingData>) => void
}

export function CompanyInfoSection({ data, onChange }: CompanyInfoSectionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="companyName">اسم الشركة *</Label>
        <Input
          id="companyName"
          value={data.companyName || ""}
          onChange={(e) => onChange({ companyName: e.target.value })}
          placeholder="شركة التقنية المتقدمة"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry">المجال / الصناعة *</Label>
        <Input
          id="industry"
          value={data.industry || ""}
          onChange={(e) => onChange({ industry: e.target.value })}
          placeholder="تقنية المعلومات، تجارة إلكترونية، خدمات..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="websiteUrl">الموقع الإلكتروني الحالي (إن وجد)</Label>
        <Input
          id="websiteUrl"
          type="url"
          value={data.websiteUrl || ""}
          onChange={(e) => onChange({ websiteUrl: e.target.value })}
          placeholder="https://example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyDescription">نبذة عن الشركة *</Label>
        <Textarea
          id="companyDescription"
          value={data.companyDescription || ""}
          onChange={(e) => onChange({ companyDescription: e.target.value })}
          placeholder="اكتب نبذة مختصرة عن شركتك وخدماتها..."
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetAudience">الجمهور المستهدف *</Label>
        <Textarea
          id="targetAudience"
          value={data.targetAudience || ""}
          onChange={(e) => onChange({ targetAudience: e.target.value })}
          placeholder="من هم عملاؤك المستهدفون؟ (العمر، الموقع، الاهتمامات...)"
          rows={3}
          required
        />
      </div>
    </div>
  )
}
