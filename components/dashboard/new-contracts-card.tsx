import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils/date"

export async function NewContractsCard() {
  const supabase = await createClient()
  
  // Get contracts that need admin approval
  const { data: contracts } = await supabase
    .from('contracts')
    .select('*')
    .eq('admin_review_approved', false)
    .eq('current_step_name', 'review')
    .order('created_at', { ascending: false })
    .limit(5)

  if (!contracts || contracts.length === 0) {
    return null
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              عقود تحتاج موافقتك
            </CardTitle>
            <CardDescription className="mt-1">
              {contracts.length} عقد في انتظار المراجعة والموافقة
            </CardDescription>
          </div>
          <Badge variant="destructive" className="animate-pulse">
            {contracts.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200 hover:border-orange-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="font-medium text-sm">{contract.contract_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {contract.client_name} • {formatDate(contract.created_at)}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/admin/contracts/${contract.id}/flow`}>
                  مراجعة
                  <ArrowRight className="h-3 w-3 mr-1" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
        
        {contracts.length > 0 && (
          <Button variant="link" className="w-full mt-3" asChild>
            <Link href="/admin/contracts">
              عرض جميع العقود
              <ArrowRight className="h-4 w-4 mr-1" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
