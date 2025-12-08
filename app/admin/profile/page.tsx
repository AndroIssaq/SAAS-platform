import { getProfileData } from "@/lib/actions/account"
import { ProfileForm } from "@/components/admin/profile-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
    title: "الملف الشخصي - إعدادات الحساب",
}

export default async function ProfilePage() {
    const { success, user, company_name, error } = await getProfileData()

    if (!success || !user) {
        return (
            <div className="container mx-auto py-8 text-center">
                <p className="text-destructive">فشل في تحميل البيانات: {error}</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">الملف الشخصي</h1>
                <p className="text-muted-foreground mt-2">
                    إدارة بياناتك الشخصية واسم الشركة الذي سيظهر في العقود.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>بيانات الحساب</CardTitle>
                    <CardDescription>
                        قم بتحديث اسم الشركة وبيانات الاتصال الخاصة بك.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProfileForm
                        user={user}
                        companyName={company_name}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
