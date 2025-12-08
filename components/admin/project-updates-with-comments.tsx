'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MessageSquare, Clock, User, AlertCircle, CheckCircle, Edit } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { toast } from 'sonner'

interface ProjectUpdate {
  id: string
  title: string
  description: string
  update_type: string
  priority: string
  created_at: string
  client_id: string
  contract_id: string
}

interface Comment {
  id: string
  comment: string
  comment_type: string
  created_at: string
  user_id: string
  user: {
    full_name: string
    role: string
  }
}

export function ProjectUpdatesWithComments({ contractId }: { contractId: string }) {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([])
  const [selectedUpdate, setSelectedUpdate] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchUpdates()
    setupRealtimeComments()
  }, [contractId])

  const fetchUpdates = async () => {
    const { data } = await supabase
      .from('project_updates')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false })

    if (data) {
      setUpdates(data)
      // Fetch comments for each update
      data.forEach(update => fetchComments(update.id))
    }
    setLoading(false)
  }

  const fetchComments = async (updateId: string) => {
    const { data } = await supabase
      .from('update_comments')
      .select(`
        *,
        user:users(full_name, role)
      `)
      .eq('update_id', updateId)
      .order('created_at', { ascending: false })

    if (data) {
      setComments(prev => ({ ...prev, [updateId]: data as Comment[] }))
    }
  }

  const setupRealtimeComments = () => {
    const channel = supabase
      .channel(`admin_comments:${contractId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'update_comments',
        },
        (payload) => {
          const newComment = payload.new as any
          // Fetch full comment with user data
          fetchComments(newComment.update_id)
          
          toast.success('💬 تعليق جديد من العميل!', {
            description: newComment.comment.substring(0, 50) + '...',
            duration: 7000,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'modification_request':
        return <Edit className="h-4 w-4 text-orange-600" />
      case 'feedback':
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  const getTypeBadge = (type: string) => {
    const types = {
      modification_request: { label: 'طلب تعديل', color: 'bg-orange-100 text-orange-800' },
      feedback: { label: 'ملاحظة', color: 'bg-blue-100 text-blue-800' },
      comment: { label: 'تعليق', color: 'bg-gray-100 text-gray-800' },
    }
    const config = types[type as keyof typeof types] || types.comment
    return <Badge className={config.color}>{config.label}</Badge>
  }

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  if (updates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          لا توجد تحديثات لهذا العقد
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {updates.map((update) => {
        const updateComments = comments[update.id] || []
        const hasComments = updateComments.length > 0

        return (
          <Card key={update.id} className={hasComments ? 'border-blue-200 bg-blue-50/30' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{update.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{update.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {hasComments && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <MessageSquare className="h-3 w-3 ml-1" />
                      {updateComments.length}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUpdate(selectedUpdate === update.id ? null : update.id)}
                  >
                    {selectedUpdate === update.id ? 'إخفاء' : 'عرض'} التعليقات
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(update.created_at), {
                  addSuffix: true,
                  locale: ar,
                })}
              </div>
            </CardHeader>

            {selectedUpdate === update.id && (
              <CardContent>
                <Separator className="mb-4" />
                <div className="space-y-4">
                  {updateComments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      لا توجد تعليقات على هذا التحديث
                    </p>
                  ) : (
                    updateComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-4 bg-white rounded-lg border"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              {comment.user?.full_name || 'مستخدم'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {comment.user?.role === 'client' ? 'عميل' : 'مدير'}
                            </Badge>
                          </div>
                          {getTypeBadge(comment.comment_type)}
                        </div>
                        <p className="text-sm mb-2">{comment.comment}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </div>
                        {comment.comment_type === 'modification_request' && (
                          <div className="mt-3 pt-3 border-t">
                            <Badge className="bg-orange-100 text-orange-800">
                              <AlertCircle className="h-3 w-3 ml-1" />
                              يتطلب اهتمامك
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
