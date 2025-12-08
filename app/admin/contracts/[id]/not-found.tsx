import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowLeft, Plus } from 'lucide-react'

export default function ContractNotFound() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="text-center space-y-6">
        <Card>
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">العقد غير موجود</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              العقد المطلوب غير موجود أو تم حذفه.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline">
                <Link href="/admin/contracts">
                  <ArrowLeft className="ml-2 h-4 w-4" />
                  العودة للعقود
                </Link>
              </Button>
              
              <Button asChild>
                <Link href="/admin/contracts/create">
                  <Plus className="ml-2 h-4 w-4" />
                  إنشاء عقد جديد
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
