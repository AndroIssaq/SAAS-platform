'use client'

/**
 * Real-time Status Checker Component
 * أداة فحص حالة Real-time
 * 
 * استخدام: أضف هذا Component في أي صفحة للتحقق من Real-time
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export function RealtimeStatusChecker() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [message, setMessage] = useState('جاري الفحص...')
  const [details, setDetails] = useState<string[]>([])

  useEffect(() => {
    const checkRealtime = async () => {
      const supabase = createClient()
      const logs: string[] = []

      try {
        // Test 1: Check Supabase client
        logs.push('✅ Supabase client created')
        
        // Test 2: Try to subscribe to a channel
        const testChannel = supabase
          .channel('realtime-test-' + Date.now())
          .on('broadcast', { event: 'test' }, () => {
            logs.push('✅ Broadcast working')
          })
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              logs.push('✅ Real-time SUBSCRIBED')
              setStatus('connected')
              setMessage('Real-time يعمل بشكل صحيح!')
            } else if (status === 'CHANNEL_ERROR') {
              logs.push('❌ Channel Error: ' + err?.message)
              setStatus('error')
              setMessage('خطأ في الاتصال بـ Real-time')
            } else if (status === 'TIMED_OUT') {
              logs.push('❌ Connection Timed Out')
              setStatus('error')
              setMessage('انتهت مهلة الاتصال')
            }
            setDetails([...logs])
          })

        // Test 3: Try postgres_changes subscription
        const dbChannel = supabase
          .channel('db-test-' + Date.now())
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'project_updates',
            },
            () => {
              logs.push('✅ Postgres changes subscription working')
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logs.push('✅ Database Real-time SUBSCRIBED')
            }
            setDetails([...logs])
          })

        // Cleanup after 10 seconds
        setTimeout(() => {
          testChannel.unsubscribe()
          dbChannel.unsubscribe()
        }, 10000)

      } catch (error: any) {
        logs.push('❌ Error: ' + error.message)
        setStatus('error')
        setMessage('حدث خطأ: ' + error.message)
        setDetails(logs)
      }
    }

    checkRealtime()
  }, [])

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === 'checking' && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
          {status === 'connected' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          {status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
          فحص Real-time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold">الحالة:</span>
          {status === 'checking' && <Badge variant="outline">جاري الفحص...</Badge>}
          {status === 'connected' && <Badge className="bg-green-600">متصل ✅</Badge>}
          {status === 'error' && <Badge className="bg-red-600">خطأ ❌</Badge>}
        </div>

        <p className="text-sm">{message}</p>

        {details.length > 0 && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs font-semibold mb-2">التفاصيل:</p>
            <div className="space-y-1">
              {details.map((detail, idx) => (
                <p key={idx} className="text-xs font-mono">
                  {detail}
                </p>
              ))}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <p className="text-sm font-semibold text-red-900 mb-2">الحلول المقترحة:</p>
            <ol className="text-xs space-y-1 list-decimal list-inside text-red-800">
              <li>تأكد من تنفيذ SQL Scripts في Supabase</li>
              <li>نفذ FIX_REALTIME_ISSUES.sql</li>
              <li>تحقق من Supabase API keys</li>
              <li>امسح Cache (Ctrl+Shift+R)</li>
              <li>أعد تشغيل التطبيق</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
