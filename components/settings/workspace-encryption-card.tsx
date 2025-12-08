import { getWorkspacePublicKey } from "@/lib/actions/workspace-keys"
import { getCurrentAccountId } from "@/lib/actions/account"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkspaceEncryptionManager } from "@/components/settings/workspace-encryption-manager"

export async function WorkspaceEncryptionCard() {
  const accountId = await getCurrentAccountId()
  const result = accountId ? await getWorkspacePublicKey() : { success: false, error: "لا يوجد مساحة عمل" }

  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle>التشفير المتقدم للعقود</CardTitle>
        <CardDescription>
          توليد وإدارة مفاتيح التشفير الطرفي (E2EE) لمساحة العمل. لا نحتفظ بالمفاتيح الخاصة على الخوادم إطلاقًا.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WorkspaceEncryptionManager
          accountId={accountId ?? null}
          initialKey={result.success ? result.data ?? null : null}
          initialError={!result.success ? result.error ?? null : null}
        />
      </CardContent>
    </Card>
  )
}
