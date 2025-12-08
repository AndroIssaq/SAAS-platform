"use client"

import { useState } from "react"
import { Service } from "@/lib/types/service"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Eye, Power, Trash2, TrendingUp } from "lucide-react"
import Link from "next/link"
import { toggleServiceStatus, deleteService } from "@/lib/actions/services"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ServicesTableProps {
  services: Service[]
}

export function ServicesTable({ services }: ServicesTableProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggleStatus = async (id: string) => {
    const result = await toggleServiceStatus(id)
    
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async () => {
    if (!selectedService) return
    
    setIsDeleting(true)
    const result = await deleteService(selectedService) // Soft delete
    
    if (result.success) {
      toast.success(result.message)
      router.refresh()
      setDeleteDialogOpen(false)
    } else {
      toast.error(result.error)
    }
    setIsDeleting(false)
  }

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      'web-development': 'bg-blue-100 text-blue-800',
      'mobile-app': 'bg-purple-100 text-purple-800',
      'design': 'bg-pink-100 text-pink-800',
      'marketing': 'bg-green-100 text-green-800',
      'consulting': 'bg-yellow-100 text-yellow-800',
      'custom': 'bg-gray-100 text-gray-800',
    }
    
    return colors[category] || colors.custom
  }

  if (!services || services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">لا توجد خدمات مسجلة</p>
        <Button asChild>
          <Link href="/admin/services/new">إضافة خدمة جديدة</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الخدمة</TableHead>
            <TableHead>الفئة</TableHead>
            <TableHead>السعر</TableHead>
            <TableHead>المدة</TableHead>
            <TableHead>العقود</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="text-left">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{service.name}</div>
                  {service.name_en && (
                    <div className="text-sm text-muted-foreground">{service.name_en}</div>
                  )}
                  {service.is_featured && (
                    <Badge variant="secondary" className="mt-1">
                      مميزة
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getCategoryBadge(service.category)}>
                  {service.category}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {service.base_price.toLocaleString('ar-EG')} {service.currency}
                </div>
                <div className="text-xs text-muted-foreground">{service.price_type}</div>
              </TableCell>
              <TableCell>
                {service.timeline || '-'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{service.total_contracts}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {service.total_revenue.toLocaleString('ar-EG')} {service.currency}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={service.is_active ? "default" : "secondary"}>
                  {service.is_active ? "نشط" : "غير نشط"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <Link href={`/admin/services/${service.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <Link href={`/admin/services/${service.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(service.id)}
                  >
                    <Power className={`h-4 w-4 ${service.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedService(service.id)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إلغاء تفعيل هذه الخدمة. يمكنك إعادة تفعيلها لاحقاً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "جاري الحذف..." : "تأكيد"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
