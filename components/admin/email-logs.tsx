"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Mail, User } from "lucide-react"

interface EmailLog {
  id: string
  recipient_email: string
  subject: string
  message: string
  status: string
  error_message?: string | null
  sent_at: string
}

interface EmailLogsProps {
  logs: EmailLog[]
}

export function EmailLogs({ logs }: EmailLogsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          سجل الرسائل المرسلة ({logs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لم يتم إرسال أي رسائل بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{log.recipient_email}</span>
                  </div>
                  <Badge
                    variant={log.status === "failed" ? "destructive" : "outline"}
                    className="text-xs"
                  >
                    {log.status === "sent" ? "تم الإرسال" : "فشل الإرسال"}
                  </Badge>
                </div>

                <h4 className="font-semibold text-sm mb-2">{log.subject}</h4>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {log.message}
                </p>

                {log.error_message && (
                  <p className="text-xs text-red-500 bg-red-50 p-2 rounded mb-2 font-mono">
                    {log.error_message}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDate(log.sent_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
