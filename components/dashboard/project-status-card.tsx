import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ProjectStatusCardProps {
  project: any
}

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  in_progress: "قيد التنفيذ",
  review: "قيد المراجعة",
  revision: "قيد التعديل",
  completed: "مكتمل",
  delivered: "تم التسليم",
  cancelled: "ملغي",
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  review: "bg-yellow-100 text-yellow-800",
  revision: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  delivered: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
}

export function ProjectStatusCard({ project }: ProjectStatusCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div>
            <CardTitle className="text-xl">{project.project_name}</CardTitle>
            <CardDescription>{project.project_type}</CardDescription>
          </div>
          <Badge className={statusColors[project.status]}>{statusLabels[project.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">التقدم</span>
            <span className="font-semibold text-primary">{project.progress_percentage}%</span>
          </div>
          <Progress value={project.progress_percentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>البداية: {new Date(project.start_date).toLocaleDateString("ar-SA")}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>التسليم: {new Date(project.expected_delivery_date).toLocaleDateString("ar-SA")}</span>
          </div>
        </div>

        {project.description && <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>}

        <Button asChild className="w-full bg-transparent" variant="outline">
          <Link href={`/client/project/${project.id}`}>عرض التفاصيل</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
