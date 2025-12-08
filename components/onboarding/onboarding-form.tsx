"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CompanyInfoSection } from "./sections/company-info-section"
import { BrandAssetsSection } from "./sections/brand-assets-section"
import { ContentMediaSection } from "./sections/content-media-section"
import { TechnicalRequirementsSection } from "./sections/technical-requirements-section"
import { PreferencesGoalsSection } from "./sections/preferences-goals-section"
import { CheckCircle2 } from "lucide-react"

export interface OnboardingData {
  // Company Info
  companyName: string
  industry: string
  websiteUrl: string
  companyDescription: string
  targetAudience: string

  // Brand Assets
  logoFiles: File[]
  brandColors: string[]
  typography: string
  brandGuidelines: string

  // Content & Media
  contentFiles: File[]
  images: File[]
  videos: string[]
  existingContent: string

  // Technical Requirements
  domains: string[]
  hostingPreference: string
  integrations: string[]
  technicalNotes: string

  // Preferences & Goals
  projectGoals: string[]
  competitors: string[]
  inspiration: string[]
  timeline: string
  budget: string
  additionalNotes: string
}

interface OnboardingFormProps {
  contractId: string
  onComplete: (data: OnboardingData) => void
}

const sections = [
  { id: 1, title: "معلومات الشركة", description: "البيانات الأساسية عن شركتك" },
  { id: 2, title: "الهوية البصرية", description: "الشعار والألوان والخطوط" },
  { id: 3, title: "المحتوى والوسائط", description: "النصوص والصور والفيديوهات" },
  { id: 4, title: "المتطلبات التقنية", description: "النطاقات والاستضافة والتكاملات" },
  { id: 5, title: "الأهداف والتفضيلات", description: "أهداف المشروع والمنافسين" },
]

export function OnboardingForm({ contractId, onComplete }: OnboardingFormProps) {
  const [currentSection, setCurrentSection] = useState(1)
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    brandColors: [],
    projectGoals: [],
    competitors: [],
    inspiration: [],
    domains: [],
    integrations: [],
    logoFiles: [],
    contentFiles: [],
    images: [],
    videos: [],
  })

  const progress = (currentSection / sections.length) * 100

  const updateFormData = (data: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleNext = () => {
    if (currentSection < sections.length) {
      setCurrentSection(currentSection + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1)
    }
  }

  const handleSubmit = () => {
    const submitData: OnboardingData = {
      companyName: formData.companyName || "",
      industry: formData.industry || "",
      websiteUrl: formData.websiteUrl || "",
      companyDescription: formData.companyDescription || "",
      targetAudience: formData.targetAudience || "",
      logoFiles: formData.logoFiles || [],
      brandColors: formData.brandColors || [],
      typography: formData.typography || "",
      brandGuidelines: formData.brandGuidelines || "",
      contentFiles: formData.contentFiles || [],
      images: formData.images || [],
      videos: formData.videos || [],
      existingContent: formData.existingContent || "",
      domains: formData.domains || [],
      hostingPreference: formData.hostingPreference || "",
      integrations: formData.integrations || [],
      technicalNotes: formData.technicalNotes || "",
      projectGoals: formData.projectGoals || [],
      competitors: formData.competitors || [],
      inspiration: formData.inspiration || [],
      timeline: formData.timeline || "",
      budget: formData.budget || "",
      additionalNotes: formData.additionalNotes || "",
    }
    onComplete(submitData)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle>نموذج التأهيل</CardTitle>
              <CardDescription>
                القسم {currentSection} من {sections.length}
              </CardDescription>
            </div>
            <div className="text-sm font-medium text-primary">{Math.round(progress)}%</div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
      </Card>

      {/* Section Navigation */}
      <div className="grid grid-cols-5 gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setCurrentSection(section.id)}
            className={`p-3 rounded-lg border-2 transition-all text-right ${
              section.id === currentSection
                ? "border-primary bg-primary/10"
                : section.id < currentSection
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-background"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {section.id < currentSection && <CheckCircle2 className="w-4 h-4 text-primary" />}
              <span className="text-xs font-semibold">القسم {section.id}</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">{section.title}</p>
          </button>
        ))}
      </div>

      {/* Current Section Content */}
      <Card>
        <CardHeader>
          <CardTitle>{sections[currentSection - 1].title}</CardTitle>
          <CardDescription>{sections[currentSection - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentSection === 1 && <CompanyInfoSection data={formData} onChange={updateFormData} />}
          {currentSection === 2 && <BrandAssetsSection data={formData} onChange={updateFormData} />}
          {currentSection === 3 && <ContentMediaSection data={formData} onChange={updateFormData} />}
          {currentSection === 4 && <TechnicalRequirementsSection data={formData} onChange={updateFormData} />}
          {currentSection === 5 && <PreferencesGoalsSection data={formData} onChange={updateFormData} />}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentSection === 1}>
          السابق
        </Button>
        {currentSection < sections.length ? (
          <Button onClick={handleNext}>التالي</Button>
        ) : (
          <Button onClick={handleSubmit}>إرسال النموذج</Button>
        )}
      </div>
    </div>
  )
}
