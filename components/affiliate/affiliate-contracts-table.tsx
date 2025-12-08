"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, FileText } from "lucide-react"

interface AffiliateContractsTableProps {
  contracts: any[]
}

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  pending_signature: "بانتظار التوقيع",
  signed: "موقع",
  active: "نشط",
  completed: "مكتمل",
  cancelled: "ملغي",
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending_signature: "bg-yellow-100 text-yellow-800",
  signed: "bg-green-100 text-green-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
}

export function AffiliateContractsTable({ contracts }: AffiliateContractsTableProps) {
  return (
    <div className="grid gap-4">
      {contracts.map((contract: any) => (
        <Card key={contract.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {contract.contract_number}
                </CardTitle>
                <CardDescription>{contract.client?.full_name}</CardDescription>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[contract.status]}`}>
                {statusLabels[contract.status]}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">نوع الخدمة</p>
                <p className="font-medium">{contract.service_type}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">الباقة</p>
                <p className="font-medium">{contract.package_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">المبلغ</p>
                <p className="font-medium">{Number(contract.total_amount).toLocaleString("ar-EG")} ج.م</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">التاريخ</p>
                <p className="font-medium">{new Date(contract.created_at).toLocaleDateString("ar-EG")}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/affiliate/contracts/${contract.id}/flow`}>عرض التفاصيل</Link>
              </Button>
              {contract.status === "draft" && (
                <Button variant="default" size="sm" asChild>
                  <Link href={`/affiliate/contracts/${contract.id}/edit`}>تعديل</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
