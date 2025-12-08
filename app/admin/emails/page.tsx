import { getAllUsers, getEmailLogs } from "@/lib/actions/emails"
import { EmailComposer } from "@/components/admin/email-composer"
import { EmailLogs } from "@/components/admin/email-logs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, History } from "lucide-react"

export default async function AdminEmailsPage() {
  const [users, logs] = await Promise.all([getAllUsers(), getEmailLogs()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إدارة البريد الإلكتروني</h1>
        <p className="text-muted-foreground">
          إرسال رسائل بريد إلكتروني للمستخدمين
        </p>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="compose" className="gap-2">
            <Mail className="h-4 w-4" />
            إنشاء رسالة
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            السجل ({logs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <EmailComposer users={users} />
        </TabsContent>

        <TabsContent value="history">
          <EmailLogs logs={logs} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
