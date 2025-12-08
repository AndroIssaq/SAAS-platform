"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { X } from "lucide-react"
import type { OnboardingData } from "../onboarding-form"

interface PreferencesGoalsSectionProps {
  data: Partial<OnboardingData>
  onChange: (data: Partial<OnboardingData>) => void
}

const goalOptions = [
  "زيادة المبيعات",
  "بناء الوعي بالعلامة التجارية",
  "جذب عملاء جدد",
  "تحسين تجربة المستخدم",
  "عرض المنتجات/الخدمات",
  "التواصل مع العملاء",
  "بناء مجتمع",
  "تقديم محتوى تعليمي",
]

export function PreferencesGoalsSection({ data, onChange }: PreferencesGoalsSectionProps) {
  const toggleGoal = (goal: string) => {
    const goals = data.projectGoals || []
    if (goals.includes(goal)) {
      onChange({ projectGoals: goals.filter((g) => g !== goal) })
    } else {
      onChange({ projectGoals: [...goals, goal] })
    }
  }

  const addCompetitor = () => {
    const competitors = data.competitors || []
    onChange({ competitors: [...competitors, ""] })
  }

  const updateCompetitor = (index: number, value: string) => {
    const competitors = [...(data.competitors || [])]
    competitors[index] = value
    onChange({ competitors })
  }

  const removeCompetitor = (index: number) => {
    const competitors = [...(data.competitors || [])]
    competitors.splice(index, 1)
    onChange({ competitors })
  }

  const addInspiration = () => {
    const inspiration = data.inspiration || []
    onChange({ inspiration: [...inspiration, ""] })
  }

  const updateInspiration = (index: number, value: string) => {
    const inspiration = [...(data.inspiration || [])]
    inspiration[index] = value
    onChange({ inspiration })
  }

  const removeInspiration = (index: number) => {
    const inspiration = [...(data.inspiration || [])]
    inspiration.splice(index, 1)
    onChange({ inspiration })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>أهداف المشروع *</Label>
        <p className="text-sm text-muted-foreground">ما الذي تريد تحقيقه من هذا المشروع؟</p>
        <div className="space-y-3">
          {goalOptions.map((goal) => (
            <div key={goal} className="flex items-center gap-2">
              <Checkbox
                id={goal}
                checked={(data.projectGoals || []).includes(goal)}
                onCheckedChange={() => toggleGoal(goal)}
              />
              <Label htmlFor={goal} className="cursor-pointer">
                {goal}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>المنافسون</Label>
        <p className="text-sm text-muted-foreground">أضف روابط مواقع منافسيك للاستفادة منها</p>
        <div className="space-y-2">
          {(data.competitors || []).map((competitor, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={competitor}
                onChange={(e) => updateCompetitor(index, e.target.value)}
                placeholder="https://competitor.com"
                className="flex-1"
              />
              <Button variant="ghost" size="sm" onClick={() => removeCompetitor(index)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addCompetitor} className="w-full bg-transparent">
            إضافة منافس
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>مواقع ملهمة</Label>
        <p className="text-sm text-muted-foreground">أضف روابط مواقع تعجبك وتريد الاستلهام منها</p>
        <div className="space-y-2">
          {(data.inspiration || []).map((site, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={site}
                onChange={(e) => updateInspiration(index, e.target.value)}
                placeholder="https://inspiration.com"
                className="flex-1"
              />
              <Button variant="ghost" size="sm" onClick={() => removeInspiration(index)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addInspiration} className="w-full bg-transparent">
            إضافة موقع
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeline">الجدول الزمني المفضل</Label>
        <Input
          id="timeline"
          value={data.timeline || ""}
          onChange={(e) => onChange({ timeline: e.target.value })}
          placeholder="مثال: 30 يوم، شهرين، في أقرب وقت..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">الميزانية الإضافية (إن وجدت)</Label>
        <Input
          id="budget"
          value={data.budget || ""}
          onChange={(e) => onChange({ budget: e.target.value })}
          placeholder="لأي خدمات إضافية غير مشمولة في العقد"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalNotes">ملاحظات إضافية</Label>
        <Textarea
          id="additionalNotes"
          value={data.additionalNotes || ""}
          onChange={(e) => onChange({ additionalNotes: e.target.value })}
          placeholder="أي معلومات أخرى تريد مشاركتها معنا..."
          rows={4}
        />
      </div>
    </div>
  )
}
