"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { X, Upload } from "lucide-react"
import type { OnboardingData } from "../onboarding-form"

interface ContentMediaSectionProps {
  data: Partial<OnboardingData>
  onChange: (data: Partial<OnboardingData>) => void
}

export function ContentMediaSection({ data, onChange }: ContentMediaSectionProps) {
  const handleContentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    onChange({ contentFiles: [...(data.contentFiles || []), ...files] })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    onChange({ images: [...(data.images || []), ...files] })
  }

  const addVideoUrl = () => {
    const videos = data.videos || []
    onChange({ videos: [...videos, ""] })
  }

  const updateVideoUrl = (index: number, value: string) => {
    const videos = [...(data.videos || [])]
    videos[index] = value
    onChange({ videos })
  }

  const removeVideo = (index: number) => {
    const videos = [...(data.videos || [])]
    videos.splice(index, 1)
    onChange({ videos })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>ملفات المحتوى النصي</Label>
        <p className="text-sm text-muted-foreground">ارفع ملفات Word, PDF تحتوي على النصوص المطلوبة</p>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <Input
            type="file"
            multiple
            accept=".doc,.docx,.pdf,.txt"
            onChange={handleContentUpload}
            className="max-w-xs mx-auto"
          />
        </div>
        {data.contentFiles && data.contentFiles.length > 0 && (
          <div className="space-y-2 mt-4">
            {data.contentFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>الصور والرسومات</Label>
        <p className="text-sm text-muted-foreground">ارفع الصور التي تريد استخدامها في المشروع</p>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <Input type="file" multiple accept="image/*" onChange={handleImageUpload} className="max-w-xs mx-auto" />
        </div>
        {data.images && data.images.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            {data.images.map((file, index) => (
              <div key={index} className="aspect-square bg-muted rounded overflow-hidden">
                <img
                  src={URL.createObjectURL(file) || "/placeholder.svg"}
                  alt={`صورة ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>روابط الفيديوهات</Label>
        <p className="text-sm text-muted-foreground">أضف روابط YouTube أو Vimeo</p>
        <div className="space-y-2">
          {(data.videos || []).map((video, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={video}
                onChange={(e) => updateVideoUrl(index, e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1"
              />
              <Button variant="ghost" size="sm" onClick={() => removeVideo(index)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addVideoUrl} className="w-full bg-transparent">
            إضافة رابط فيديو
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="existingContent">محتوى نصي إضافي</Label>
        <Textarea
          id="existingContent"
          value={data.existingContent || ""}
          onChange={(e) => onChange({ existingContent: e.target.value })}
          placeholder="يمكنك لصق أي نصوص تريد استخدامها هنا..."
          rows={6}
        />
      </div>
    </div>
  )
}
