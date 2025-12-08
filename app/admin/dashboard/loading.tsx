import { Loader2 } from "lucide-react"

export default function AdminDashboardLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">جاري تحميل لوحة التحكم...</p>
      </div>
    </div>
  )
}
