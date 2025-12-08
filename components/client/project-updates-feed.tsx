'use client'

/**
 * Project Updates Feed
 * عرض تحديثات المشاريع للعميل
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { markUpdateAsRead } from '@/lib/actions/project-updates'
import { toast } from 'sonner'

interface ProjectUpdate {
  id: string
  contract_id: string
  title: string
  description?: string
  update_type: 'progress' | 'milestone' | 'completed' | 'feedback_needed' | 'issue'
  attachments: Array<{
    type: 'image' | 'link' | 'file'
    url: string
    caption?: string
    title?: string
  }>
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_read: boolean
  created_at: string
}

interface ProjectUpdatesFeedProps {
  clientId: string
  limit?: number
}

export function ProjectUpdatesFeed({ clientId, limit = 10 }: ProjectUpdatesFeedProps) {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUpdate, setExpandedUpdate] = useState<string | null>(null)

  // Fetch updates
  useEffect(() => {
    const fetchUpdates = async () => {
      const supabase = createClient()
      
      try {
        const { data, error } = await supabase
          .from('project_updates')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (data) {
          setUpdates(data)
        }
        
        // If table doesn't exist yet, just show empty state
        if (error && error.code === 'PGRST205') {
          console.log('project_updates table not found yet')
        }
      } catch (err) {
        console.log('Error fetching updates:', err)
      }
      
      setLoading(false)
    }

    fetchUpdates()
  }, [clientId, limit])

  // Real-time subscription
  useEffect(() => {
    if (!clientId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`project_updates:${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_updates',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          console.log('📢 Dashboard received update:', payload)
          if (payload.eventType === 'INSERT') {
            setUpdates((prev) => {
              const newUpdate = payload.new as ProjectUpdate
              // تحقق من عدم وجود التحديث مسبقاً
              if (prev.some(u => u.id === newUpdate.id)) return prev
              return [newUpdate, ...prev]
            })
            toast.success('📢 تحديث جديد في مشروعك!', {
              description: payload.new.title,
              duration: 7000,
              action: {
                label: 'عرض',
                onClick: () => window.location.href = '/client/project-updates',
              },
            })
          } else if (payload.eventType === 'UPDATE') {
            setUpdates((prev) =>
              prev.map((u) => (u.id === payload.new.id ? (payload.new as ProjectUpdate) : u))
            )
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Dashboard realtime status:', status)
        if (err) {
          console.error('Dashboard realtime error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Dashboard subscribed to project updates')
        }
      })

    return () => {
      console.log('Dashboard unsubscribing')
      supabase.removeChannel(channel)
    }
  }, [clientId])

  const handleMarkAsRead = async (updateId: string) => {
    const result = await markUpdateAsRead(updateId)
    if (result.success) {
      setUpdates((prev) =>
        prev.map((u) => (u.id === updateId ? { ...u, is_read: true } : u))
      )
    }
  }

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'milestone':
        return <Sparkles className="h-5 w-5 text-purple-600" />
      case 'feedback_needed':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'issue':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-blue-600" />
    }
  }

  const getUpdateColor = (type: string) => {
    switch (type) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'milestone':
        return 'bg-purple-50 border-purple-200'
      case 'feedback_needed':
        return 'bg-orange-50 border-orange-200'
      case 'issue':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-600">عاجل</Badge>
      case 'high':
        return <Badge className="bg-orange-600">مهم</Badge>
      case 'low':
        return <Badge variant="outline">عادي</Badge>
      default:
        return null
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'الآن'
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    if (diffHours < 24) return `منذ ${diffHours} ساعة`
    if (diffDays < 7) return `منذ ${diffDays} يوم`

    return d.toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-20 bg-muted rounded animate-pulse"></div>
            <div className="h-20 bg-muted rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (updates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            آخر التحديثات
          </CardTitle>
          <CardDescription>تحديثات المشاريع والأحداث</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground text-sm">
            لا توجد تحديثات حالياً
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ستظهر هنا التحديثات الجديدة من فريق العمل
          </p>
        </CardContent>
      </Card>
    )
  }

  const unreadCount = updates.filter((u) => !u.is_read).length

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              آخر التحديثات
              {unreadCount > 0 && (
                <Badge className="bg-red-600 text-white">
                  {unreadCount} جديد
                </Badge>
              )}
            </CardTitle>
            <CardDescription>تحديثات المشاريع والأحداث</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <AnimatePresence>
            {updates.map((update, index) => (
              <motion.div
                key={update.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className={`${getUpdateColor(update.update_type)} transition-all hover:shadow-md ${
                    !update.is_read ? 'border-2' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getUpdateIcon(update.update_type)}</div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                              {update.title}
                              {!update.is_read && (
                                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                              )}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(update.created_at)}
                            </p>
                          </div>
                          {getPriorityBadge(update.priority)}
                        </div>

                        {update.description && (
                          <p className="text-sm text-foreground/80 mb-3 line-clamp-2">
                            {update.description}
                          </p>
                        )}

                        {/* Attachments */}
                        {update.attachments && update.attachments.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {update.attachments.map((attachment, idx) => (
                              <div key={idx}>
                                {attachment.type === 'image' && (
                                  <div className="relative rounded-lg overflow-hidden border">
                                    <img
                                      src={attachment.url}
                                      alt={attachment.caption || 'صورة'}
                                      className="w-full h-auto max-h-48 object-cover"
                                    />
                                    {attachment.caption && (
                                      <p className="text-xs text-muted-foreground p-2 bg-background/80">
                                        {attachment.caption}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {attachment.type === 'link' && (
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 bg-background rounded-lg border hover:bg-accent transition-colors"
                                  >
                                    <LinkIcon className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium flex-1 truncate">
                                      {attachment.title || attachment.url}
                                    </span>
                                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {!update.is_read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(update.id)}
                            className="text-xs h-7"
                          >
                            <CheckCircle2 className="h-3 w-3 ml-1" />
                            تم القراءة
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
