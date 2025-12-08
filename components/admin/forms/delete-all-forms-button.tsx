"use client"

import { deleteAllForms } from "@/lib/actions/forms-builder"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTransition } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function DeleteAllFormsButton({ formsCount }: { formsCount: number }) {
    const [isPending, startTransition] = useTransition()
    const { toast } = useToast()
    const router = useRouter()

    const handleDeleteAll = () => {
        if (formsCount === 0) {
            toast({
                title: "لا توجد نماذج للحذف",
                description: "القائمة فارغة بالفعل.",
                variant: "default",
            })
            return
        }

        if (window.confirm(`هل أنت متأكد من حذف جميع النماذج (${formsCount} نموذج)؟ لا يمكن التراجع عن هذا الإجراء.`)) {
            startTransition(async () => {
                try {
                    await deleteAllForms()
                    toast({
                        title: "تم الحذف بنجاح",
                        description: `تم حذف جميع النماذج (${formsCount}) نهائياً من النظام.`,
                        variant: "default",
                    })
                    router.refresh()
                } catch (error) {
                    toast({
                        title: "حدث خطأ",
                        description: "لم نتمكن من حذف النماذج، يرجى المحاولة مرة أخرى.",
                        variant: "destructive",
                    })
                }
            })
        }
    }

    return (
        <Button
            variant="destructive"
            size="lg"
            className="gap-2"
            onClick={handleDeleteAll}
            disabled={isPending || formsCount === 0}
        >
            <Trash2 className="w-5 h-5" />
            {isPending ? "جاري الحذف..." : "حذف الكل"}
        </Button>
    )
}
