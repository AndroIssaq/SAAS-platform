"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  FileText,
  Users,
  FolderKanban,
  MessageSquare,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ImageIcon,
  UserCircle,
  Sparkles,
  Mail,
  BarChart2,
  FormInput,
} from "lucide-react"
import { useUnreadNotifications } from "@/hooks/use-unread-notifications"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { logout } from "@/lib/actions/auth"

interface NavItem {
  title: string
  href: string
  icon: any
  badge?: number
}

interface AppSidebarProps {
  userRole: "admin" | "affiliate" | "client"
  userId: string
  userName: string
}

export function AppSidebar({ userRole, userId, userName }: AppSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const unreadNotifications = useUnreadNotifications(userId)
  const { unreadCount: unreadMessages } = useUnreadMessages(userId)

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setIsCollapsed(saved === "true")
    }
  }, [])

  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", String(newState))
  }

  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = []

    if (userRole === "admin") {
      return [
        { title: "لوحة التحكم", href: "/admin/dashboard", icon: LayoutDashboard },
        { title: "التقارير", href: "/admin/reports", icon: BarChart2 },
        { title: "الخدمات", href: "/admin/services", icon: Sparkles },
        { title: "العقود", href: "/admin/contracts", icon: FileText },
        { title: "الفورمز", href: "/admin/forms", icon: FormInput },
        { title: "العملاء", href: "/admin/clients", icon: Users },
        { title: "المشاريع", href: "/admin/projects", icon: FolderKanban },
        { title: "الرسائل", href: "/admin/messages", icon: MessageSquare, badge: unreadMessages },
        { title: "البريد الإلكتروني", href: "/admin/emails", icon: Mail },
        { title: "تحديثات المشاريع", href: "/admin/project-updates", icon: Sparkles },
        { title: "معرض الأعمال", href: "/admin/portfolio", icon: ImageIcon },
        { title: "الإشعارات", href: "/admin/notifications", icon: Bell, badge: unreadNotifications },
        { title: "الملف الشخصي", href: "/admin/profile", icon: UserCircle },
        { title: "الإعدادات", href: "/admin/settings", icon: Settings },
      ]
    }

    if (userRole === "affiliate") {
      return [
        { title: "لوحة التحكم", href: "/affiliate/dashboard", icon: LayoutDashboard },
        { title: "الخدمات", href: "/affiliate/services", icon: Sparkles },
        { title: "العقود", href: "/affiliate/contracts", icon: FileText },
        { title: "العملاء", href: "/affiliate/clients", icon: Users },
        { title: "الرسائل", href: "/affiliate/messages", icon: MessageSquare, badge: unreadMessages },
        { title: "معرض الأعمال", href: "/portfolio", icon: ImageIcon },
        { title: "الإشعارات", href: "/affiliate/notifications", icon: Bell, badge: unreadNotifications },
        { title: "الملف الشخصي", href: "/affiliate/profile", icon: UserCircle },
      ]
    }

    if (userRole === "client") {
      return [
        { title: "لوحة التحكم", href: "/client/dashboard", icon: LayoutDashboard },
        { title: "تحديثات المشاريع", href: "/client/project-updates", icon: Sparkles },
        { title: "المشاريع", href: "/client/projects", icon: FolderKanban },
        { title: "العقود", href: "/client/contracts", icon: FileText },
        { title: "الرسائل", href: "/client/messages", icon: MessageSquare, badge: unreadMessages },
        { title: "معرض الأعمال", href: "/portfolio", icon: ImageIcon },
        { title: "الإشعارات", href: "/client/notifications", icon: Bell, badge: unreadNotifications },
      ]
    }

    return baseItems
  }

  const navItems = getNavItems()

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <ChevronRight /> : <ChevronLeft />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "h-screen bg-background border-l transition-all duration-300 ease-in-out shadow-lg overflow-y-auto",
          // Desktop - Sticky
          "hidden lg:block lg:sticky lg:top-0",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          // Mobile - Fixed
          "fixed right-0 top-0 z-40",
          isMobileOpen ? "block translate-x-0 w-64" : "translate-x-full w-64 lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                    ع
                  </div>
                  <span className="font-bold text-lg whitespace-nowrap">عَقدي</span>
                </div>
              )}
              {isCollapsed && (
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold mx-auto">
                  ع
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapsed}
                className={cn("hidden lg:flex", isCollapsed && "mx-auto")}
              >
                {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* User Info */}
          {!isCollapsed && (
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium text-sm truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {userRole === "admin" && "مدير النظام"}
                    {userRole === "affiliate" && "شريك"}
                    {userRole === "client" && "عميل"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              // Fix: Exact match for dashboard pages, startsWith for sub-paths
              const isDashboard = item.href.endsWith("/dashboard")
              const isActive = pathname === item.href ||
                (!isDashboard && pathname.startsWith(item.href + "/"))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium">{item.title}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge
                          variant={isActive ? "secondary" : "default"}
                          className="h-5 min-w-5 flex items-center justify-center px-1.5"
                        >
                          {item.badge > 99 ? "99+" : item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                  {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <div className="absolute top-1 left-1 w-2 h-2 bg-destructive rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          <Separator />

          {/* Logout */}
          <div className="p-4">
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">تسجيل الخروج</span>}
              </Button>
            </form>
          </div>
        </div>
      </aside>
    </>
  )
}
