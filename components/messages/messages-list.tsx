"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Search, Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  subject?: string
  message: string
  is_read: boolean
  created_at: string
  sender?: { full_name: string; email: string }
  receiver?: { full_name: string; email: string }
}

interface MessagesListProps {
  initialMessages: Message[]
  currentUserId: string
  onSelectConversation: (userId: string, userName: string) => void
}

export function MessagesList({ initialMessages, currentUserId, onSelectConversation }: MessagesListProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || [])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Setup real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("messages-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            // Fetch user data for new message
            const { data: users } = await supabase
              .from("users")
              .select("id, full_name, email")
              .in("id", [payload.new.sender_id, payload.new.receiver_id])

            const userMap = new Map(users?.map(u => [u.id, u]) || [])
            
            const newMessage = {
              ...payload.new,
              sender: userMap.get(payload.new.sender_id),
              receiver: userMap.get(payload.new.receiver_id),
            }

            setMessages((prev) => Array.isArray(prev) ? [newMessage, ...prev] : [newMessage])
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              Array.isArray(prev) ? prev.map((msg) => (msg.id === payload.new.id ? { ...msg, ...payload.new } : msg)) : []
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Group messages by conversation
  const conversations = Array.isArray(messages) 
    ? messages.reduce((acc: any[], message: Message) => {
        const otherUserId = message.sender_id === currentUserId ? message.receiver_id : message.sender_id
        const otherUser = message.sender_id === currentUserId ? message.receiver : message.sender
        
        const existing = acc.find((c) => c.userId === otherUserId)

        if (existing) {
          existing.messages.push(message)
          // Always update to latest message
          if (new Date(message.created_at) > new Date(existing.lastMessage.created_at)) {
            existing.lastMessage = message
          }
          if (!message.is_read && message.receiver_id === currentUserId) {
            existing.unreadCount++
          }
        } else {
          acc.push({
            userId: otherUserId,
            userName: otherUser?.full_name || otherUser?.email || "مستخدم",
            userEmail: otherUser?.email || "",
            messages: [message],
            lastMessage: message,
            unreadCount: !message.is_read && message.receiver_id === currentUserId ? 1 : 0,
          })
        }

        return acc
      }, [])
    : []

  // Sort by last message date
  if (conversations.length > 0) {
    conversations.sort((a, b) => 
      new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    )
  }

  // Filter conversations
  const filteredConversations = searchQuery
    ? conversations.filter((c) =>
        c.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
    } else if (days === 1) {
      return "أمس"
    } else if (days < 7) {
      return `${days} أيام`
    } else {
      return date.toLocaleDateString("ar-SA")
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="ابحث عن محادثة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">
              {searchQuery ? "لا توجد نتائج" : "لا توجد محادثات"}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.userId}
                onClick={() => onSelectConversation(conversation.userId, conversation.userName)}
                className="w-full p-4 hover:bg-muted/50 transition-colors text-right flex items-start gap-3"
              >
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(conversation.userName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm truncate">
                      {conversation.userName}
                    </h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0 mr-2">
                      {formatTime(conversation.lastMessage.created_at)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-sm flex-1 overflow-hidden",
                      conversation.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                    )}
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      wordBreak: 'break-word'
                    }}>
                      {conversation.lastMessage?.message || "لا توجد رسالة"}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge className="flex-shrink-0 h-5 min-w-[20px] rounded-full px-1.5 flex items-center justify-center text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
