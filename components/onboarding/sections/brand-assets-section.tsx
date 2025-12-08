"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { X, Upload } from "lucide-react"
import type { OnboardingData } from "../onboarding-form"

interface BrandAssetsSectionProps {
  data: Partial<OnboardingData>
  onChange: (data: Partial<OnboardingData>) => void
}

export function BrandAssetsSection({ data, onChange }: BrandAssetsSectionProps) {
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    onChange({ logoFiles: [...(data.logoFiles || []), ...files] })
  }

  const removeLogoFile = (index: number) => {
    const newFiles = [...(data.logoFiles || [])]
    newFiles.splice(index, 1)
    onChange({ logoFiles: newFiles })
  }

  const addColor = () => {
    const colors = data.brandColors || []
    onChange({ brandColors: [...colors, "#000000"] })
  }

  const updateColor = (index: number, value: string) => {
    const colors = [...(data.brandColors || [])]
    colors[index] = value
    onChange({ brandColors: colors })
  }

  const removeColor = (index: number) => {
    const colors = [...(data.brandColors || [])]
    colors.splice(index, 1)
    onChange({ brandColors: colors })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>الشعار (Logo) *</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-4">ارفع ملفات الشعار (PNG, SVG, AI, PDF)</p>
          <Input
            type="file"
            multiple
            accept=".png,.svg,.ai,.pdf,.jpg,.jpeg"
            onChange={handleLogoUpload}
            className="max-w-xs mx-auto"
          />
        </div>
        {data.logoFiles && data.logoFiles.length > 0 && (
          <div className="space-y-2 mt-4">
            {data.logoFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">{file.name}</span>
                <Button variant="ghost" size="sm" onClick={() => removeLogoFile(index)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>ألوان العلامة التجارية *</Label>
        <p className="text-sm text-muted-foreground">أضف الألوان الأساسية لعلامتك التجارية</p>
        <div className="space-y-2">
          {(data.brandColors || []).map((color, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input type="color" value={color} onChange={(e) => updateColor(index, e.target.value)} className="w-20" />
              <Input value={color} onChange={(e) => updateColor(index, e.target.value)} className="flex-1" />
              <Button variant="ghost" size="sm" onClick={() => removeColor(index)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addColor} className="w-full bg-transparent">
            إضافة لون
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="typography">الخطوط المفضلة</Label>
        <Input
          id="typography"
          value={data.typography || ""}
          onChange={(e) => onChange({ typography: e.target.value })}
          placeholder="مثال: Cairo, Tajawal, Almarai..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brandGuidelines">دليل الهوية البصرية (إن وجد)</Label>
        <Textarea
          id="brandGuidelines"
          value={data.brandGuidelines || ""}
          onChange={(e) => onChange({ brandGuidelines: e.target.value })}
          placeholder="أي ملاحظات أو إرشادات خاصة بالهوية البصرية..."
          rows={4}
        />
      </div>
    </div>
  )
}
