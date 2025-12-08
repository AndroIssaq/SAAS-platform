import Link from "next/link"
import { getAllProjects } from "@/lib/actions/admin"
import { ProjectsTable } from "@/components/admin/projects-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function AdminProjectsPage() {
  const projects = await getAllProjects()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">المشاريع</h1>
          <p className="text-muted-foreground">إدارة جميع المشاريع</p>
        </div>
        <Button asChild>
          <Link href="/admin/projects/new">
            <Plus className="ml-2 h-4 w-4" />
            مشروع جديد
          </Link>
        </Button>
      </div>

      <ProjectsTable projects={projects} />
    </div>
  )
}
