"use client"

import { DataTable } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { handlePayoutConfirmation } from "@/lib/actions/affiliates"

interface PayoutsTableProps {
  payouts: any[]
}

export function PayoutsTable({ payouts }: PayoutsTableProps) {
  const columns = [
    {
      key: "created_at",
      label: "التاريخ",
      render: (payout: any) => new Date(payout.created_at).toLocaleDateString("ar-SA"),
    },
    {
      key: "affiliate",
      label: "الشريك",
      render: (payout: any) => payout.affiliates?.name || "-",
    },
    {
      key: "amount",
      label: "المبلغ",
      render: (payout: any) => `${payout.amount.toLocaleString("ar-EG")} ج.م`,
    },
    {
      key: "status",
      label: "الحالة",
      render: (payout: any) => {
        const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
          pending: { label: "قيد الانتظار", variant: "secondary" },
          paid: { label: "مدفوع", variant: "default" },
          cancelled: { label: "ملغي", variant: "outline" },
        }
        const status = statusMap[payout.status] || { label: payout.status, variant: "secondary" as const }
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
    },
    {
      key: "paid_at",
      label: "تاريخ الدفع",
      render: (payout: any) => (payout.paid_at ? new Date(payout.paid_at).toLocaleDateString("ar-SA") : "-"),
    },
    {
      key: "actions",
      label: "الإجراءات",
      render: (payout: any) =>
        payout.status === "pending" ? (
          <form action={handlePayoutConfirmation.bind(null, payout.id)}>
            <Button type="submit" variant="ghost" size="sm">
              <Check className="h-4 w-4 ml-1" />
              تأكيد الدفع
            </Button>
          </form>
        ) : null,
    },
  ]

  return <DataTable data={payouts} columns={columns} searchKey="affiliates.name" searchPlaceholder="البحث..." />
}
