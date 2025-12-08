'use client'

/**
 * Client Project Updates View
 * عرض تحديثات المشاريع للعميل مع إمكانية التعليق
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Send,
  Loader2,
  Image as ImageIcon,
  Link as LinkIcon,
  ExternalLink,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { addUpdateComment } from '@/lib/actions/project-updates'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

interface ProjectUpdate {
  id: string
  contract_id: string
  title: string
  description?: string
  update_type: string
  attachments: Array<{
    type: 'image' | 'link' | 'file'
    url: string
    caption?: string
    title?: string
  }>
  priority: string
  is_read: boolean
  created_at: string
}

interface Comment {
  id: string
  comment: string
  comment_type: string
  user: {
    full_name: string
    role: string
  }
  created_at: string
}

interface ClientProjectUpdatesViewProps {
  clientId: string
}

export function ClientProjectUpdatesView({ clientId }: ClientProjectUpdatesViewProps) {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUpdate, setExpandedUpdate] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<'comment' | 'feedback' | 'modification_request'>('comment')
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  // Fetch updates
  useEffect(() => {
    const fetchUpdates = async () => {
      const { data } = await supabase
        .from('project_updates')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (data) {
        setUpdates(data)
      }
      setLoading(false)
    }

    fetchUpdates()

    // Real-time subscription for new updates
    const channel = supabase
      .channel(`client_updates:${clientId}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_updates',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          console.log('📢 New update received:', payload)
          const newUpdate = payload.new as ProjectUpdate
          setUpdates((prev) => {
            // تحقق من عدم وجود التحديث مسبقاً
            if (prev.some(u => u.id === newUpdate.id)) return prev
            return [newUpdate, ...prev]
          })
          toast.success('📢 تحديث جديد!', {
            description: newUpdate.title,
            duration: 7000,
          })
        }
      )
      .subscribe((status, err) => {
        console.log('Realtime subscription status:', status)
        if (err) {
          console.error('Realtime subscription error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to project updates')
        }
      })

    return () => {
      console.log('Unsubscribing from channel')
      supabase.removeChannel(channel)
    }
  }, [clientId])

  // Fetch comments for an update
  const fetchComments = async (updateId: string) => {
    const { data } = await supabase
      .from('update_comments')
      .select(`
        *,
        user:users(full_name, role)
      `)
      .eq('update_id', updateId)
      .order('created_at', { ascending: true })

    if (data) {
      setComments((prev) => ({ ...prev, [updateId]: data }))
    }
  }

  // Toggle update expansion
  const toggleUpdate = (updateId: string) => {
    if (expandedUpdate === updateId) {
      setExpandedUpdate(null)
    } else {
      setExpandedUpdate(updateId)
      if (!comments[updateId]) {
        fetchComments(updateId)
      }
    }
  }

  // Submit comment
  const handleSubmitComment = async (update: ProjectUpdate) => {
    if (!newComment.trim()) {
      toast.error('يرجى كتابة تعليق')
      return
    }

    setSubmitting(true)

    try {
      const result = await addUpdateComment({
        update_id: update.id,
        contract_id: update.contract_id,
        comment: newComment,
        comment_type: commentType,
      })

      if (result.success) {
        const typeLabel = commentType === 'modification_request' ? 'طلب التعديل' : 
                         commentType === 'feedback' ? 'الملاحظة' : 'التعليق'
        toast.success(`✅ تم إرسال ${typeLabel} بنجاح!`, {
          description: 'سيصل إشعار للإدارة',
          duration: 5000,
        })
        setNewComment('')
        setCommentType('comment')
        await fetchComments(update.id)
      } else {
        toast.error(result.error || 'فشل في إضافة التعليق', {
          description: 'يرجى المحاولة مرة أخرى',
          duration: 5000,
        })
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع', {
        description: 'يرجى المحاولة مرة أخرى',
      })
    } finally {
      setSubmitting(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (updates.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-20">
          <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">لا توجد تحديثات</h3>
          <p className="text-muted-foreground text-sm">
            ستظهر التحديثات الجديدة هنا
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {updates.map((update, index) => {
          const isExpanded = expandedUpdate === update.id
          const updateComments = comments[update.id] || []

          return (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className={`${getUpdateColor(update.update_type)} border-2`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getUpdateIcon(update.update_type)}
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{update.title}</CardTitle>
                        <CardDescription>
                          {formatDistanceToNow(new Date(update.created_at), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {update.priority === 'urgent' && <Badge className="bg-red-600">عاجل</Badge>}
                      {update.priority === 'high' && <Badge className="bg-orange-600">مهم</Badge>}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Description */}
                  {update.description && (
                    <p className="text-foreground/80">{update.description}</p>
                  )}

                  {/* Attachments */}
                  {update.attachments && update.attachments.length > 0 && (
                    <div className="space-y-2">
                      {update.attachments.map((attachment, idx) => (
                        <div key={idx}>
                          {attachment.type === 'image' && (
                            <div className="rounded-lg overflow-hidden border">
                              <img
                                src={attachment.url}
                                alt={attachment.caption || 'صورة'}
                                className="w-full h-auto max-h-96 object-cover"
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
                              className="flex items-center gap-2 p-3 bg-background rounded-lg border hover:bg-accent transition-colors"
                            >
                              <LinkIcon className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium flex-1">
                                {attachment.title || attachment.url}
                              </span>
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* Comments Toggle */}
                  <Button
                    variant="ghost"
                    onClick={() => toggleUpdate(update.id)}
                    className="w-full"
                  >
                    <MessageSquare className="h-4 w-4 ml-2" />
                    {isExpanded ? 'إخفاء' : 'عرض'} التعليقات
                    {updateComments.length > 0 && ` (${updateComments.length})`}
                  </Button>

                  {/* Comments Section */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-4"
                    >
                      {/* Existing Comments */}
                      {updateComments.length > 0 && (
                        <div className="space-y-3">
                          {updateComments.map((comment) => (
                            <div
                              key={comment.id}
                              className="flex gap-3 p-3 bg-background rounded-lg"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {comment.user.full_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm">
                                    {comment.user.full_name}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {comment.user.role === 'admin' ? 'إدارة' : 'عميل'}
                                  </Badge>
                                  {comment.comment_type === 'modification_request' && (
                                    <Badge className="bg-orange-600 text-xs">طلب تعديل</Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(comment.created_at), {
                                      addSuffix: true,
                                      locale: ar,
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm">{comment.comment}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <Separator />

                      {/* Add Comment Form */}
                      <div className="space-y-3">
                        <Select
                          value={commentType}
                          onValueChange={(value: any) => setCommentType(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="comment">💬 تعليق عادي</SelectItem>
                            <SelectItem value="feedback">💡 ملاحظة</SelectItem>
                            <SelectItem value="modification_request">🔄 طلب تعديل</SelectItem>
                          </SelectContent>
                        </Select>

                        <Textarea
                          placeholder="اكتب تعليقك أو ملاحظاتك هنا..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                        />

                        <Button
                          onClick={() => handleSubmitComment(update)}
                          disabled={submitting || !newComment.trim()}
                          className="w-full"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                              جاري الإرسال...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 ml-2" />
                              إرسال التعليق
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
