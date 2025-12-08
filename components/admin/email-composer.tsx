"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { sendEmail } from "@/lib/actions/emails"
import { Mail, Send, X, Loader2, Users, CheckCircle2, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  status: string
}

interface EmailComposerProps {
  users: User[]
}

export function EmailComposer({ users }: EmailComposerProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [customEmail, setCustomEmail] = useState("")
  const router = useRouter()

  const handleAddCustomEmail = () => {
    if (!customEmail.trim()) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customEmail.trim())) {
      setError("صيغة البريد الإلكتروني غير صحيحة")
      return
    }

    const email = customEmail.trim()
    if (!selectedUsers.includes(email)) {
      setSelectedUsers([...selectedUsers, email])
      setCustomEmail("")
      setError(null)
    } else {
      setCustomEmail("")
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleUser = (email: string) => {
    setSelectedUsers((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    )
  }

  const selectAll = () => {
    setSelectedUsers(filteredUsers.map((u) => u.email))
  }

  const selectClients = () => {
    setSelectedUsers(
      filteredUsers
        .filter((u) => u.role === "client")
        .map((u) => u.email)
    )
  }

  const selectAffiliates = () => {
    setSelectedUsers(
      filteredUsers
        .filter((u) => u.role === "affiliate")
        .map((u) => u.email)
    )
  }

  const clearAll = () => {
    setSelectedUsers([])
  }

  const handleSend = async () => {
    if (selectedUsers.length === 0) {
      setError("يرجى اختيار مستلم واحد على الأقل")
      return
    }

    if (!subject.trim()) {
      setError("يرجى إدخال عنوان البريد")
      return
    }

    if (!message.trim()) {
      setError("يرجى إدخال نص الرسالة")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await sendEmail({
      to: selectedUsers,
      subject: subject.trim(),
      message: message.trim(),
    })

    if (result.success) {
      setSuccess(true)
      setSubject("")
      setMessage("")
      setSelectedUsers([])
      router.refresh()

      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } else {
      setError(result.error || "فشل في إرسال البريد")
    }

    setLoading(false)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500"
      case "affiliate":
        return "bg-blue-500"
      case "client":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "مسؤول"
      case "affiliate":
        return "شريك"
      case "client":
        return "عميل"
      default:
        return role
    }
  }

  return (
    <div className="grid lg:grid-cols-[350px_1fr] gap-6">
      {/* Users Selection */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            المستلمون ({selectedUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <Input
            placeholder="ابحث عن مستخدم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Add Manual Email */}
          <div className="flex gap-2">
            <Input
              placeholder="بريد خارجي (example@gmail.com)"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddCustomEmail()
                }
              }}
            />
            <Button size="sm" onClick={handleAddCustomEmail} disabled={!customEmail.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="flex-1"
              >
                تحديد الكل
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="flex-1"
              >
                إلغاء الكل
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectClients}
                className="flex-1"
              >
                العملاء فقط
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAffiliates}
                className="flex-1"
              >
                الشركاء فقط
              </Button>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => toggleUser(user.email)}
              >
                <Checkbox
                  checked={selectedUsers.includes(user.email)}
                  onCheckedChange={() => toggleUser(user.email)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">
                      {user.full_name}
                    </p>
                    <Badge
                      className={`${getRoleBadgeColor(user.role)} text-white text-xs`}
                    >
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Composer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            إنشاء بريد إلكتروني
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">تم إرسال البريد بنجاح!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <p className="font-medium">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Selected Recipients */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>المستلمون ({selectedUsers.length})</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg max-h-32 overflow-y-auto">
                {selectedUsers.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {email}
                    <button
                      onClick={() => toggleUser(email)}
                      className="hover:bg-background rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">العنوان</Label>
            <Input
              id="subject"
              placeholder="أدخل عنوان البريد..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">الرسالة</Label>
            <Textarea
              id="message"
              placeholder="اكتب رسالتك هنا..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              className="resize-none"
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={loading || selectedUsers.length === 0}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="ml-2 h-5 w-5" />
                إرسال إلى {selectedUsers.length} مستلم
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
