import { EnhancedContractForm } from "@/components/admin/enhanced-admin-contract-form"
import { getProfileData } from "@/lib/actions/account"

export default async function CreateContractPage() {
    const profile = await getProfileData()
    const companyName = profile.success ? profile.company_name : undefined
    const providerName = profile.success ? profile.user?.full_name : undefined

    return (
        <div className="container max-w-7xl py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">إنشاء عقد جديد</h1>
                <p className="text-muted-foreground mt-2">
                    املأ البيانات أدناه لإنشاء عقد جديد
                </p>
            </div>

            <EnhancedContractForm 
                providerCompanyName={companyName}
                providerName={providerName}
            />
        </div>
    )
}
