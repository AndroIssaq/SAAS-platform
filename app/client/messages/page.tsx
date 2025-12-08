import { getMessages } from "@/lib/actions/messages"
import { MessagesView } from "@/components/messages/messages-view"

export default async function ClientMessagesPage() {
  const result = await getMessages()
  const messages = result?.data || []

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">الرسائل</h1>
            <p className="text-muted-foreground">التواصل مع فريق العمل</p>
          </div>

          <MessagesView messages={messages} />
        </div>
      </div>
    </div>
  )
}
