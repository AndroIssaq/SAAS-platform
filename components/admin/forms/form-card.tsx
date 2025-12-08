"use client"

import Link from "next/link"
import { MoreHorizontal, PenSquare, Trash, Layout, Eye, MousePointerClick } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { deleteFormById } from "@/lib/actions/forms"
import { useTransition } from "react"
import { useToast } from "@/hooks/use-toast"

export function FormCard({ form }: { form: any }) {
    const [isPending, startTransition] = useTransition()
    const { toast } = useToast()

    const handleDelete = async () => {
        startTransition(async () => {
            try {
                await deleteFormById(form.id)
                toast({
                    title: "تم الحذف بنجاح",
                    description: "تم حذف النموذج نهائياً من النظام.",
                    variant: "default",
                })
            } catch (error) {
                toast({
                    title: "حدث خطأ",
                    description: "لم نتمكن من حذف النموذج، يرجى المحاولة مرة أخرى.",
                    variant: "destructive",
                })
            }
        })
    }

    return (
        <Card className={`overflow-hidden hover:shadow-md transition-all group flex flex-col ${isPending ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            {/* Thumbnail Area */}
            <div className={`h-40 w-full bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center`}>
                {/* Simple visualization of type */}
                <div className="opacity-20 transform scale-75">
                    {form.type === 'popup' && <Layout className="w-20 h-20" />}
                </div>

                {/* Status Badge */}
                <Badge
                    className="absolute top-3 right-3 bg-white/90 text-black hover:bg-white backdrop-blur-sm shadow-sm"
                    variant={form.status === 'published' ? 'default' : 'secondary'}
                >
                    {form.status === 'published' ? 'نشط' : 'مسودة'}
                </Badge>

                {/* Hover Action */}
                <Link href={`/admin/forms/${form.id}`} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[1px]">
                    <Button variant="secondary" className="font-bold">تعديل التصميم</Button>
                </Link>
            </div>

            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold truncate pr-4">{form.title || form.name}</CardTitle>
                        <CardDescription className="mt-1 capitalize">{form.type}</CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <Link href={`/admin/forms/${form.id}`}>
                                <DropdownMenuItem className="gap-2 cursor-pointer">
                                    <PenSquare className="w-4 h-4" />
                                    تعديل
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                                className="text-destructive gap-2 cursor-pointer"
                                onSelect={(e) => {
                                    e.preventDefault()
                                    if (window.confirm(`هل أنت متأكد من حذف النموذج "${form.title || form.name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
                                        handleDelete()
                                    }
                                }}
                            >
                                <Trash className="w-4 h-4" />
                                حذف
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardFooter className="pt-2 border-t bg-muted/20 mt-auto">
                <p className="text-xs text-muted-foreground w-full text-right" suppressHydrationWarning>
                    أنشئ: {new Date(form.created_at).toLocaleDateString('ar-EG')}
                </p>
            </CardFooter>
        </Card>
    )
}
