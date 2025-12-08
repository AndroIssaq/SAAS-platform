"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Send, Loader2 } from "lucide-react"
import { sendMessage } from "@/lib/actions/messages"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getAllUsers } from "@/lib/actions/emails"

interface MessageComposerProps {
  onClose: () => void
  receiverId?: string
  receiverName?: string
}

export function MessageComposer({ onClose, receiverId: initialReceiverId, receiverName }: MessageComposerProps) {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState(initialReceiverId || "")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!initialReceiverId) {
      loadUsers()
    }
  }, [initialReceiverId])

  const loadUsers = async () => {
    setLoadingUsers(true)

    try {
      // Use server action to get all users (including manual clients)
      const validUsers = await getAllUsers()

      if (validUsers && validUsers.length > 0) {
        console.log("Loaded valid users:", validUsers.length, validUsers)
        setUsers(validUsers)
      } else {
        setUsers([])
      }
    } catch (err) {
      console.error("Exception loading users:", err)
      setUsers([])
    }

    setLoadingUsers(false)
  }

  const handleSend = async () => {
    if (!selectedUserId) {
      setError("يرجى اختيار المستلم")
      return
    }

    if (!message.trim()) {
      setError("يرجى كتابة رسالة")
      return
    }

    setLoading(true)
    setError("")

    const result = await sendMessage({
      receiverId: selectedUserId,
      subject,
      message: message.trim(),
    })

    if (result.success) {
      router.refresh()
      onClose()
    } else {
      setError(result.error || "فشل في إرسال الرسالة")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">رسالة جديدة</h2>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          {receiverName ? (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="text-muted-foreground">إلى:</span> {receiverName}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="receiver">المستلم</Label>
              {loadingUsers ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري تحميل المستخدمين...
                </div>
              ) : users.length === 0 ? (
                <div className="p-4 border-2 border-dashed rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    لا يوجد مستخدمين آخرين في النظام
                  </p>
                  <p className="text-xs text-muted-foreground">
                    يجب إنشاء عملاء أو شركاء أولاً لإرسال رسائل لهم
                  </p>
                </div>
              ) : (
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المستلم" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email} ({user.role === "client" ? "عميل" : user.role === "affiliate" ? "شريك" : "مسؤول"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">الموضوع (اختياري)</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="موضوع الرسالة"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">الرسالة</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              rows={6}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              إلغاء
            </Button>
            <Button onClick={handleSend} disabled={loading || !selectedUserId}>
              {loading ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="ml-2 h-4 w-4" />
              )}
              إرسال
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
