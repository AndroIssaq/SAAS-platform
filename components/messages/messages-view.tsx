"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, Plus } from "lucide-react"
import { MessageComposer } from "./message-composer"
import { MessagesList } from "./messages-list"
import { ChatView } from "./chat-view"
import { createClient } from "@/lib/supabase/client"

interface MessagesViewProps {
  messages: any[]
}

export function MessagesView({ messages: initialMessages }: MessagesViewProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string>("")
  const [showComposer, setShowComposer] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const supabase = createClient()

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getCurrentUser()
  }, [])

  const handleSelectConversation = (userId: string, userName: string) => {
    setSelectedUserId(userId)
    setSelectedUserName(userName)
    setShowComposer(false)
  }

  const handleBack = () => {
    setSelectedUserId(null)
    setSelectedUserName("")
    setShowComposer(false)
  }

  // Show loading state during hydration
  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (showComposer) {
    return <MessageComposer onClose={() => setShowComposer(false)} />
  }

  if (selectedUserId) {
    return (
      <ChatView
        otherUserId={selectedUserId}
        otherUserName={selectedUserName}
        currentUserId={currentUserId}
        onBack={handleBack}
      />
    )
  }

  return (
    <div className="grid md:grid-cols-[400px_1fr] gap-4 h-[calc(100vh-200px)]">
      {/* Conversations List */}
      <Card className="h-full flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg">المحادثات</h2>
          <Button size="sm" onClick={() => setShowComposer(true)}>
            <Plus className="h-4 w-4 ml-2" />
            محادثة جديدة
          </Button>
        </div>
        <MessagesList
          initialMessages={initialMessages}
          currentUserId={currentUserId}
          onSelectConversation={handleSelectConversation}
        />
      </Card>

      {/* Empty State */}
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Send className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium mb-2">اختر محادثة</p>
          <p className="text-sm">اختر محادثة من القائمة أو ابدأ محادثة جديدة</p>
        </div>
      </Card>
    </div>
  )
}
