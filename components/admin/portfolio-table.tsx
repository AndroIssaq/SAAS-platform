"use client"

import Link from "next/link"
import { DataTable } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

interface PortfolioTableProps {
  portfolioItems: any[]
}

export function PortfolioTable({ portfolioItems }: PortfolioTableProps) {
  const columns = [
    {
      key: "title",
      label: "العنوان",
    },
    {
      key: "category",
      label: "الفئة",
      render: (item: any) => <Badge variant="secondary">{item.category}</Badge>,
    },
    {
      key: "project",
      label: "المشروع",
      render: (item: any) => item.projects?.name || "-",
    },
    {
      key: "is_published",
      label: "الحالة",
      render: (item: any) => (
        <Badge variant={item.is_published ? "default" : "outline"}>{item.is_published ? "منشور" : "مسودة"}</Badge>
      ),
    },
    {
      key: "display_order",
      label: "الترتيب",
    },
    {
      key: "actions",
      label: "الإجراءات",
      render: (item: any) => (
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/admin/portfolio/${item.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  return <DataTable data={portfolioItems} columns={columns} searchKey="title" searchPlaceholder="البحث عن عمل..." />
}
