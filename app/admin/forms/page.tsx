import { Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FormCard } from "@/components/admin/forms/form-card"
import { getAllForms } from "@/lib/actions/forms"

export const dynamic = 'force-dynamic'

export default async function FormsPage() {
    const { forms, error } = await getAllForms()

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">الفورمز</h1>
                    <p className="text-muted-foreground mt-1">
                        إدارة نماذج التسجيل والبوب أب والـ Sticky Bars
                    </p>
                </div>
                <Link href="/admin/forms/new">
                    <Button size="lg" className="gap-2">
                        <Plus className="w-5 h-5" />
                        إنشاء فورم جديد
                    </Button>
                </Link>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-destructive text-sm">{error}</p>
                </div>
            )}

            {/* Forms Grid */}
            {forms && forms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {forms.map((form) => (
                        <FormCard key={form.id} form={form} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center">
                        <Plus className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold">لا توجد فورمز حتى الآن</h3>
                        <p className="text-muted-foreground text-sm max-w-sm">
                            ابدأ بإنشاء أول فورم لك وزيادة التفاعل مع زوار موقعك
                        </p>
                    </div>
                    <Link href="/admin/forms/new">
                        <Button size="lg" className="gap-2 mt-4">
                            <Plus className="w-5 h-5" />
                            إنشاء فورم جديد
                        </Button>
                    </Link>
                </div>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
                <Link href="/admin/forms/leads" className="group">
                    <div className="p-4 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                            العملاء المحتملين
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            عرض جميع الليدز من كل الفورمز
                        </p>
                    </div>
                </Link>
                <Link href="/admin/forms/signups" className="group">
                    <div className="p-4 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                            التسجيلات
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            عرض جميع تسجيلات المستخدمين
                        </p>
                    </div>
                </Link>
                <Link href="/admin/forms/templates" className="group">
                    <div className="p-4 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                            القوالب الجاهزة
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            استخدم قوالب جاهزة لإنشاء فورمز بسرعة
                        </p>
                    </div>
                </Link>
            </div>
        </div>
    )
}
