"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Bell,
  BellOff,
  CheckCheck,
  FileText,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Trash2,
  X,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { toast } from "sonner"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { deleteNotification, clearAllNotifications, clearReadNotifications } from "@/app/actions/notifications"
import { NotificationSkeleton } from "@/components/ui/loading-states"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  link: string
  created_at: string
  data: any
}

interface NotificationsListZustandProps {
  userId: string
}

export function NotificationsListZustand({ userId }: NotificationsListZustandProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingRead, setMarkingRead] = useState<string[]>([])
  const [deleting, setDeleting] = useState<string[]>([])
  const [showClearAllDialog, setShowClearAllDialog] = useState(false)
  const [showClearReadDialog, setShowClearReadDialog] = useState(false)

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (data && !error) {
        setNotifications(data)
      }
      setLoading(false)
    }

    fetchNotifications()
  }, [userId])

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new as Notification, ...prev])

            // Show toast
            toast.info(payload.new.title, {
              description: payload.new.message,
              duration: 10000,
            })

            // Browser notification
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(payload.new.title, {
                body: payload.new.message,
                icon: "/logo.png",
                badge: "/logo.png",
              })
            }
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
            )
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    setMarkingRead((prev) => [...prev, notificationId])

    const supabase = createClient()
    const { error } = await supabase
      .from("notifications")
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
    }

    setMarkingRead((prev) => prev.filter((id) => id !== notificationId))
  }

  // Mark all as read
  const markAllAsRead = async () => {
    const supabase = createClient()
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)

    const { error } = await supabase
      .from("notifications")
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .in("id", unreadIds)

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast.success("تم تعليم جميع الإشعارات كمقروءة")
    }
  }

  // Delete single notification
  const handleDelete = async (notificationId: string) => {
    setDeleting((prev) => [...prev, notificationId])

    const result = await deleteNotification(notificationId)

    if (result.success) {
      // The real-time subscription will handle removing it from the UI
      toast.success("تم حذف الإشعار")
    } else {
      toast.error("فشل في حذف الإشعار")
      setDeleting((prev) => prev.filter((id) => id !== notificationId))
    }
  }

  // Clear all notifications
  const handleClearAll = async () => {
    const result = await clearAllNotifications(userId)

    if (result.success) {
      setNotifications([])
      toast.success("تم مسح جميع الإشعارات")
    } else {
      toast.error("فشل في مسح الإشعارات")
    }

    setShowClearAllDialog(false)
  }

  // Clear read notifications
  const handleClearRead = async () => {
    const result = await clearReadNotifications(userId)

    if (result.success) {
      setNotifications((prev) => prev.filter((n) => !n.read))
      toast.success("تم مسح الإشعارات المقروءة")
    } else {
      toast.error("فشل في مسح الإشعارات المقروءة")
    }

    setShowClearReadDialog(false)
  }

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "contract_created":
        return <FileText className="h-5 w-5 text-blue-600" />
      case "payment_approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "payment_rejected":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "step_completed":
        return <Clock className="h-5 w-5 text-orange-600" />
      case "contract_finalized":
        return <CheckCheck className="h-5 w-5 text-emerald-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const readCount = notifications.filter((n) => n.read).length

  if (loading) {
    return <NotificationSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>الإشعارات</CardTitle>
                <CardDescription>
                  {unreadCount > 0 ? (
                    <>
                      لديك <strong>{unreadCount}</strong> إشعار غير مقروء
                    </>
                  ) : (
                    "لا توجد إشعارات جديدة"
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-2">
                  <CheckCheck className="h-4 w-4" />
                  تعليم الكل كمقروء
                </Button>
              )}
              {readCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearReadDialog(true)}
                  className="gap-2 text-orange-600 hover:text-orange-700"
                >
                  <Trash2 className="h-4 w-4" />
                  مسح المقروءة
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearAllDialog(true)}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  مسح الكل
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لا توجد إشعارات حتى الآن</p>
          </CardContent>
        </Card>
      ) : (
        <div className="max-h-[600px] overflow-y-auto px-1">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, height: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  layout
                >
                  <Card
                    className={`group cursor-pointer transition-all hover:shadow-md relative ${!notification.read
                        ? "border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent"
                        : "bg-background hover:bg-accent/50"
                      }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id)
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={`flex-shrink-0 p-2 rounded-lg ${!notification.read ? "bg-primary/10" : "bg-muted"
                            }`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{notification.title}</h4>
                            {!notification.read && (
                              <Badge className="bg-primary text-xs flex-shrink-0">جديد</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: ar,
                              })}
                            </p>
                            {notification.link && (
                              <Link href={notification.link}>
                                <Button size="sm" variant="ghost" className="text-xs h-7">
                                  عرض التفاصيل ←
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              disabled={markingRead.includes(notification.id)}
                              className="flex-shrink-0 h-8 w-8 p-0"
                            >
                              {markingRead.includes(notification.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCheck className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(notification.id)
                            }}
                            disabled={deleting.includes(notification.id)}
                            className="flex-shrink-0 h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {deleting.includes(notification.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Clear All Dialog */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>مسح جميع الإشعارات؟</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف جميع الإشعارات؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
              مسح الكل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Read Dialog */}
      <AlertDialog open={showClearReadDialog} onOpenChange={setShowClearReadDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>مسح الإشعارات المقروءة؟</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف جميع الإشعارات المقروءة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearRead} className="bg-orange-600 hover:bg-orange-700">
              مسح المقروءة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
