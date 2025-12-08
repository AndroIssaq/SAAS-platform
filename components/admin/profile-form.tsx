"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateProfileData } from "@/lib/actions/account"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ProfileFormProps {
    user: {
        id: string
        email: string
        full_name: string
        role: string
    }
    companyName: string
}

export function ProfileForm({ user, companyName }: ProfileFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        fullName: user.full_name,
        companyName: companyName
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await updateProfileData({
                fullName: formData.fullName,
                companyName: formData.companyName
            })

            if (result.success) {
                toast.success("تم تحديث الملف الشخصي بنجاح")
                router.refresh()
            } else {
                toast.error(result.error || "فشل في التحديث")
            }
        } catch (error) {
            toast.error("حدث خطأ غير متوقع")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-muted"
                />
                <p className="text-[11px] text-muted-foreground">لا يمكن تغيير البريد الإلكتروني.</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="fullName">الاسم الكامل</Label>
                <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="أدخل اسمك الكامل"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="companyName">اسم الشركة (يظهر في العقود)</Label>
                <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="أدخل اسم شركتك"
                    required
                />
                <p className="text-[11px] text-muted-foreground">
                    سيتم استخدام هذا الاسم كطرف أول في العقود التي تنشئها.
                </p>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    حفظ التغييرات
                </Button>
            </div>
        </form>
    )
}
