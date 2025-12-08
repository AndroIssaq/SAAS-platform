import { AppSidebar } from "./app-sidebar"

interface SidebarLayoutProps {
  children: React.ReactNode
  userRole: "admin" | "affiliate" | "client"
  userId: string
  userName: string
}

export function SidebarLayout({ children, userRole, userId, userName }: SidebarLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar userRole={userRole} userId={userId} userName={userName} />
      <main className="flex-1 min-h-screen">
        {children}
      </main>
    </div>
  )
}
