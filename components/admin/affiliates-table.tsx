"use client"

import Link from "next/link"
import { DataTable } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

interface AffiliatesTableProps {
  affiliates: any[]
}

export function AffiliatesTable({ affiliates }: AffiliatesTableProps) {
  const columns = [
    {
      key: "name",
      label: "الاسم",
    },
    {
      key: "email",
      label: "البريد الإلكتروني",
    },
    {
      key: "referral_code",
      label: "كود الإحالة",
      render: (affiliate: any) => (
        <code className="px-2 py-1 bg-muted rounded text-sm">{affiliate.referral_code}</code>
      ),
    },
    {
      key: "commission_rate",
      label: "نسبة العمولة",
      render: (affiliate: any) => `${affiliate.commission_rate}%`,
    },
    {
      key: "status",
      label: "الحالة",
      render: (affiliate: any) => (
        <Badge variant={affiliate.status === "active" ? "default" : "secondary"}>
          {affiliate.status === "active" ? "نشط" : "غير نشط"}
        </Badge>
      ),
    },
    {
      key: "contracts",
      label: "الإحالات",
      render: (affiliate: any) => affiliate.contracts?.[0]?.count || 0,
    },
    {
      key: "actions",
      label: "الإجراءات",
      render: (affiliate: any) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/admin/affiliates/${affiliate.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ]

  return <DataTable data={affiliates} columns={columns} searchKey="name" searchPlaceholder="البحث عن شريك..." />
}
