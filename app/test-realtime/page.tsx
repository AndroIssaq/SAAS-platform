'use client'

/**
 * Real-time Test Page
 * صفحة اختبار Real-time
 * 
 * استخدام: افتح /test-realtime لاختبار Real-time
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react'

export default function TestRealtimePage() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [logs, setLogs] = useState<string[]>([])
  const [updates, setUpdates] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ar-EG')
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20))
  }

  const testRealtime = async () => {
    setStatus('connecting')
    setLogs([])
    const supabase = createClient()

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        addLog(`✅ Logged in as: ${user.email}`)
      } else {
        addLog('❌ Not logged in!')
        setStatus('error')
        return
      }

      // Subscribe to project_updates
      addLog('🔄 Subscribing to project_updates...')
      
      const channel = supabase
        .channel(`realtime-test-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_updates',
          },
          (payload) => {
            addLog(`📢 RECEIVED: ${payload.eventType} - ${JSON.stringify(payload.new?.title || payload.new)}`)
            setUpdates(prev => [payload, ...prev].slice(0, 10))
          }
        )
        .subscribe((status, err) => {
          addLog(`Status: ${status}`)
          
          if (err) {
            addLog(`❌ Error: ${err.message}`)
            setStatus('error')
          }
          
          if (status === 'SUBSCRIBED') {
            addLog('✅ Successfully SUBSCRIBED to realtime!')
            setStatus('connected')
          } else if (status === 'CHANNEL_ERROR') {
            addLog('❌ CHANNEL_ERROR')
            setStatus('error')
          } else if (status === 'TIMED_OUT') {
            addLog('❌ Connection TIMED_OUT')
            setStatus('error')
          }
        })

      // Test query
      addLog('🔄 Testing query...')
      const { data, error: queryError } = await supabase
        .from('project_updates')
        .select('*')
        .limit(5)

      if (queryError) {
        addLog(`❌ Query error: ${queryError.message}`)
        if (queryError.code === 'PGRST205') {
          addLog('❌ Table project_updates does NOT exist!')
          addLog('✅ Run: QUICK_SQL_FOR_PROJECT_UPDATES.sql')
        }
        setStatus('error')
      } else {
        addLog(`✅ Query successful: ${data?.length || 0} records found`)
      }

    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`)
      setStatus('error')
    }
  }

  useEffect(() => {
    testRealtime()
  }, [])

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {status === 'idle' && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === 'connecting' && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
              {status === 'connected' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              {status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
              اختبار Real-time
            </CardTitle>
            <Button onClick={testRealtime} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 ml-2" />
              إعادة الاختبار
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className="font-semibold">الحالة:</span>
            {status === 'idle' && <Badge variant="outline">جاري البدء...</Badge>}
            {status === 'connecting' && <Badge className="bg-blue-600">جاري الاتصال...</Badge>}
            {status === 'connected' && <Badge className="bg-green-600">متصل ✅</Badge>}
            {status === 'error' && <Badge className="bg-red-600">خطأ ❌</Badge>}
          </div>

          {/* User Info */}
          {userId && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>User ID:</strong> <code className="text-xs">{userId}</code>
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold mb-2">📋 كيفية الاختبار:</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>افتح نافذة أخرى كـ Admin</li>
              <li>اذهب إلى <code>/admin/project-updates</code></li>
              <li>أرسل تحديث جديد</li>
              <li>راقب هذه الصفحة - يجب أن ترى التحديث فوراً!</li>
            </ol>
          </div>

          {/* Logs */}
          <div>
            <h3 className="font-semibold mb-2">📝 السجلات (Logs):</h3>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">جاري التحميل...</p>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </div>

          {/* Received Updates */}
          {updates.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">
                📢 التحديثات المستلمة ({updates.length}):
              </h3>
              <div className="space-y-2">
                {updates.map((update, idx) => (
                  <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-xs font-mono">
                      <div><strong>Event:</strong> {update.eventType}</div>
                      <div><strong>Title:</strong> {update.new?.title || 'N/A'}</div>
                      <div><strong>Time:</strong> {new Date().toLocaleTimeString('ar-EG')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Help */}
          {status === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2">🔴 المشكلة:</h3>
              <ul className="text-sm space-y-2 text-red-800">
                <li>
                  <strong>إذا رأيت: "Table does NOT exist"</strong>
                  <br />
                  ✅ الحل: نفذ <code>QUICK_SQL_FOR_PROJECT_UPDATES.sql</code>
                </li>
                <li>
                  <strong>إذا رأيت: "CHANNEL_ERROR"</strong>
                  <br />
                  ✅ الحل: تحقق من Supabase API keys
                </li>
                <li>
                  <strong>إذا رأيت: "TIMED_OUT"</strong>
                  <br />
                  ✅ الحل: تحقق من اتصال الإنترنت
                </li>
              </ul>
            </div>
          )}

          {/* Success Message */}
          {status === 'connected' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">✅ جاهز!</h3>
              <p className="text-sm text-green-800">
                Real-time يعمل! الآن أرسل تحديث من Admin ولاحظ ظهوره هنا فوراً.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
