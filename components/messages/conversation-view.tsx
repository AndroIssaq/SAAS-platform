"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send } from "lucide-react"
import { sendMessage, getConversation } from "@/lib/actions/messages"
import { useRouter } from "next/navigation"

interface ConversationViewProps {
  conversation: any
  onBack: () => void
}

export function ConversationView({ conversation, onBack }: ConversationViewProps) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState(conversation.messages)

  useEffect(() => {
    // Refresh messages
    const loadMessages = async () => {
      const data = await getConversation(conversation.userId)
      setMessages(data)
    }
    loadMessages()
  }, [conversation.userId])

  const handleSend = async () => {
    if (!message.trim()) return

    setLoading(true)
    const result = await sendMessage({
      receiverId: conversation.userId,
      message: message.trim(),
    })

    if (result.success) {
      setMessage("")
      const data = await getConversation(conversation.userId)
      setMessages(data)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{conversation.userName}</h2>
          <p className="text-sm text-muted-foreground">{conversation.userEmail}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4">
            {messages.map((msg: any) => {
              const isMe = msg.sender_id === msg.sender.id
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      isMe ? "bg-muted" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${isMe ? "text-muted-foreground" : "opacity-70"}`}>
                      {new Date(msg.created_at).toLocaleString("ar-SA")}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك..."
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <Button onClick={handleSend} disabled={loading || !message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
