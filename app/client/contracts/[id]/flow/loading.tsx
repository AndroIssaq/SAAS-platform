import { Loader2 } from "lucide-react"

export default function FlowLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">جاري تحميل العقد...</p>
      </div>
    </div>
  )
}
