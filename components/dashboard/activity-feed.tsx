import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react"

interface Activity {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
}

interface ActivityFeedProps {
  activities: Activity[]
}

const activityIcons: Record<string, any> = {
  contract: FileText,
  completed: CheckCircle2,
  pending: Clock,
  alert: AlertCircle,
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>النشاطات الأخيرة</CardTitle>
        <CardDescription>آخر التحديثات على مشاريعك</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد نشاطات حالياً</p>
          ) : (
            activities.map((activity) => {
              const Icon = activityIcons[activity.type] || FileText
              return (
                <div key={activity.id} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString("ar-SA")}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
