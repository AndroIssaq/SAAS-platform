"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send, Loader2, Check, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { sendMessage, markMessageAsRead } from "@/lib/actions/messages"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ChatViewProps {
  otherUserId: string
  otherUserName: string
  currentUserId: string
  onBack: () => void
}

export function ChatView({ otherUserId, otherUserName, currentUserId, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    loadMessages()
    
    // Setup real-time subscription
    const channel = supabase
      .channel(`chat-${otherUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new
          if (
            (msg.sender_id === currentUserId && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === currentUserId)
          ) {
            setMessages((prev) => [...prev, msg])
            
            // Mark as read if received
            if (msg.receiver_id === currentUserId && !msg.is_read) {
              markMessageAsRead(msg.id)
            }
            
            setTimeout(scrollToBottom, 100)
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [otherUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
      )
      .order("created_at", { ascending: true })

    if (data) {
      setMessages(data)
      
      // Mark unread messages as read
      const unreadIds = data
        .filter((msg) => msg.receiver_id === currentUserId && !msg.is_read)
        .map((msg) => msg.id)
      
      if (unreadIds.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in("id", unreadIds)
      }
    }
    setLoading(false)
  }

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    const result = await sendMessage({
      receiverId: otherUserId,
      message: newMessage.trim(),
    })

    if (result.success) {
      setNewMessage("")
      router.refresh()
    }
    setSending(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(otherUserName)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h2 className="font-semibold">{otherUserName}</h2>
          <p className="text-xs text-muted-foreground">متصل</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>ابدأ المحادثة بإرسال رسالة</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isMe = msg.sender_id === currentUserId
              const showDate =
                index === 0 ||
                new Date(messages[index - 1].created_at).toDateString() !==
                  new Date(msg.created_at).toDateString()

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {new Date(msg.created_at).toLocaleDateString("ar-SA", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  
                  <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted rounded-bl-none"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <div className={cn(
                        "flex items-center gap-1 mt-1",
                        isMe ? "justify-end" : "justify-start"
                      )}>
                        <span className={cn(
                          "text-xs",
                          isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {formatTime(msg.created_at)}
                        </span>
                        {isMe && (
                          msg.is_read ? (
                            <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                          ) : (
                            <Check className="h-3 w-3 text-primary-foreground/70" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="اكتب رسالتك..."
            className="resize-none min-h-[60px] max-h-[120px]"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="h-[60px] w-[60px] flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
