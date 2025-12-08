"use client"

import Link from "next/link"
import { DataTable } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

interface ProjectsTableProps {
  projects: any[]
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    pending: { label: "قيد الانتظار", variant: "secondary" },
    in_progress: { label: "قيد التنفيذ", variant: "default" },
    review: { label: "قيد المراجعة", variant: "outline" },
    completed: { label: "مكتمل", variant: "default" },
    on_hold: { label: "متوقف", variant: "secondary" },
  }

  const columns = [
    {
      key: "name",
      label: "اسم المشروع",
    },
    {
      key: "client",
      label: "العميل",
      render: (project: any) => project.clients?.company_name || "-",
    },
    {
      key: "status",
      label: "الحالة",
      render: (project: any) => {
        const status = statusMap[project.status] || { label: project.status, variant: "secondary" as const }
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
    },
    {
      key: "progress",
      label: "التقدم",
      render: (project: any) => `${project.progress || 0}%`,
    },
    {
      key: "start_date",
      label: "تاريخ البدء",
      render: (project: any) => (project.start_date ? new Date(project.start_date).toLocaleDateString("ar-SA") : "-"),
    },
    {
      key: "actions",
      label: "الإجراءات",
      render: (project: any) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/admin/projects/${project.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ]

  return <DataTable data={projects} columns={columns} searchKey="name" searchPlaceholder="البحث عن مشروع..." />
}
