"use client"

import { useState } from "react"
import Image from "next/image"
import { X, ExternalLink, Calendar, Eye, Tag } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface PortfolioProject {
  id: string
  title: string
  title_en?: string
  slug: string
  category: string
  description: string
  client_name: string
  year: number
  thumbnail_url?: string
  technologies?: string[]
  features?: string[]
  color?: string
  live_url?: string | null
  github_url?: string | null
  status: string
  featured: boolean
  views: number
  created_at: string
}

interface PortfolioQuickViewProps {
  project: PortfolioProject | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PortfolioQuickView({ project, open, onOpenChange }: PortfolioQuickViewProps) {
  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {project.title}
            {project.featured && <Badge variant="secondary">⭐ مميز</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Thumbnail */}
          {project.thumbnail_url && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
              <Image
                src={project.thumbnail_url}
                alt={project.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">الفئة</p>
              <Badge variant="outline">{project.category}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">العميل</p>
              <p className="font-medium">{project.client_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">السنة</p>
              <p className="font-medium">{project.year}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">المشاهدات</p>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{project.views || 0}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-bold text-lg">الوصف</h3>
            <p className="text-muted-foreground leading-relaxed">{project.description}</p>
          </div>

          {/* Technologies */}
          {project.technologies && project.technologies.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Tag className="h-5 w-5" />
                التقنيات المستخدمة
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, index) => (
                  <Badge key={index} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {project.features && project.features.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-lg">المميزات الرئيسية</h3>
              <ul className="space-y-2">
                {project.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Links */}
          <div className="flex flex-wrap gap-3">
            {project.live_url && (
              <Button asChild variant="default" size="sm">
                <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="ml-2 h-4 w-4" />
                  زيارة الموقع
                </a>
              </Button>
            )}
            {project.github_url && (
              <Button asChild variant="outline" size="sm">
                <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="ml-2 h-4 w-4" />
                  GitHub
                </a>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <a href={`/portfolio/${project.slug}`} target="_blank">
                <ExternalLink className="ml-2 h-4 w-4" />
                عرض في المعرض
              </a>
            </Button>
          </div>

          {/* Meta Info */}
          <div className="pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>تاريخ الإنشاء: {new Date(project.created_at).toLocaleDateString("ar-EG")}</span>
              <Badge variant={project.status === "published" ? "default" : "secondary"}>
                {project.status === "published" ? "منشور" : "مسودة"}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
