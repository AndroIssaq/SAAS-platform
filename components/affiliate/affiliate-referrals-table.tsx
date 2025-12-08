"use client"

import { DataTable } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"

interface AffiliateReferralsTableProps {
  referrals: any[]
}

export function AffiliateReferralsTable({ referrals }: AffiliateReferralsTableProps) {
  const columns = [
    {
      key: "created_at",
      label: "التاريخ",
      render: (contract: any) => new Date(contract.created_at).toLocaleDateString("ar-SA"),
    },
    {
      key: "client",
      label: "العميل",
      render: (contract: any) => contract.clients?.company_name || "-",
    },
    {
      key: "service_type",
      label: "الخدمة",
    },
    {
      key: "total_amount",
      label: "قيمة العقد",
      render: (contract: any) => `${contract.total_amount.toLocaleString("ar-EG")} ج.م`,
    },
    {
      key: "status",
      label: "الحالة",
      render: (contract: any) => {
        const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
          draft: { label: "مسودة", variant: "secondary" },
          sent: { label: "مرسل", variant: "outline" },
          signed: { label: "موقع", variant: "default" },
          completed: { label: "مكتمل", variant: "default" },
        }
        const status = statusMap[contract.status] || { label: contract.status, variant: "secondary" as const }
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
    },
  ]

  return <DataTable data={referrals} columns={columns} />
}
