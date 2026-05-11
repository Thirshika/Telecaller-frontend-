"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  GraduationCap,
  LayoutDashboard,
  Phone,
  Calendar,
  History,
  ClipboardList,
  FileText,
  Users,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
  UserCircle,
  MapPin,
  BarChart3,
  BookOpen,
  FolderOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { type UserRole, mockNotifications } from "@/lib/mock-data"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const telecallerNav: NavItem[] = [
  { title: "Dashboard", href: "/telecaller/dashboard", icon: LayoutDashboard },
  { title: "Callbacks", href: "/telecaller/callbacks", icon: Calendar, badge: 5 },
  { title: "Call History", href: "/telecaller/history", icon: History },
  { title: "Follow-up Tasks", href: "/telecaller/followups", icon: ClipboardList, badge: 2 },
]

const spocNav: NavItem[] = [
  { title: "Dashboard", href: "/spoc/dashboard", icon: LayoutDashboard },
  { title: "New Report", href: "/spoc/report/new", icon: FileText },
  { title: "Past Reports", href: "/spoc/reports", icon: FolderOpen },
  { title: "Lead Bank", href: "/spoc/leads", icon: Users },
  { title: "Telecallers", href: "/spoc/telecallers", icon: Phone },
  { title: "Follow-ups", href: "/spoc/followups", icon: ClipboardList },
]

const adminNav: NavItem[] = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Prospects", href: "/admin/prospects", icon: Users },
  { title: "Follow-ups", href: "/admin/followups", icon: History },
  { title: "Courses", href: "/admin/courses", icon: BookOpen },
  { title: "Reports", href: "/admin/reports", icon: BarChart3 },
]

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case "telecaller":
      return telecallerNav
    case "spoc":
      return spocNav
    case "admin":
      return adminNav
    default:
      return []
  }
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "telecaller":
      return "Telecaller"
    case "spoc":
      return "SPOC"
    case "admin":
      return "Administrator"
    default:
      return "User"
  }
}

interface DashboardLayoutProps {
  children: React.ReactNode
  role: UserRole
  userName: string
}

export function DashboardLayout({ children, role, userName }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [callbackCount, setCallbackCount] = useState<number | undefined>(undefined)
  const [followupCount, setFollowupCount] = useState<number | undefined>(undefined)
  const unreadNotifications = mockNotifications.filter((n) => !n.read).length

  useEffect(() => {
    if (role !== "telecaller" || !user?.id) return

    // AbortController ensures that when React StrictMode tears down the effect
    // (mount → unmount → remount in dev), the in-flight fetch is cancelled with
    // an AbortError rather than surfacing as a red "TypeError: Failed to fetch".
    const controller = new AbortController()
    const { signal } = controller
    const BASE = "http://localhost:5000/api"

    // Fetch prospect count to populate Callbacks badge
    fetch(`${BASE}/prospects`, {
      headers: { "Content-Type": "application/json" },
      signal,
    })
      .then((r) => r.json())
      .then((data) => {
        const myProspects = data.filter(
          (p: any) => p.assignedTo === user.id || p.assignedTo === null || p.assignedTo === ""
        )
        const callbacks = myProspects.filter(
          (p: any) =>
            p.status === "Callback" ||
            p.status === "callback" ||
            p.status === "callback_scheduled" ||
            p.status === "Callback Scheduled"
        )
        setCallbackCount(callbacks.length > 0 ? callbacks.length : undefined)
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("[DashboardLayout] prospects fetch:", err)
      })

    // Fetch follow-up count to populate Follow-up Tasks badge
    fetch(`${BASE}/telecallers/${user.id}/follow-ups`, {
      headers: { "Content-Type": "application/json" },
      signal,
    })
      .then((r) => r.json())
      .then((tasks) => {
        const pending = tasks.filter((t: any) => t.status !== "Completed")
        setFollowupCount(pending.length > 0 ? pending.length : undefined)
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("[DashboardLayout] follow-ups fetch:", err)
      })

    // Cancel any in-flight requests when the effect cleans up
    return () => controller.abort()
  }, [role, user?.id])

  // Update nav items with dynamic badges if available
  const navItems = getNavItems(role).map(item => {
    if (item.title === "Callbacks" && callbackCount !== undefined) {
      return { ...item, badge: callbackCount }
    }
    if (item.title === "Follow-up Tasks" && followupCount !== undefined) {
      return { ...item, badge: followupCount }
    }
    return item
  })

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("flex flex-col h-full", mobile ? "pt-4" : "")}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-semibold text-sm">CEMS</h1>
          <p className="text-xs text-muted-foreground">{getRoleLabel(role)}</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => mobile && setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <Badge
                    variant={isActive ? "secondary" : "default"}
                    className="h-5 min-w-5 px-1.5 text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel(role)}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r bg-background print:hidden">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6 print:hidden">
          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar mobile />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-muted hover:border-primary/50 transition-colors">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto print:overflow-visible p-4 lg:p-6">{children}</main>
      </div>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>View your account details and profile information.</DialogDescription>
          </DialogHeader>
          <div className="bg-slate-900 h-32 relative">
             <div className="absolute -bottom-12 left-8">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-bold">
                    {userName.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
             </div>
          </div>
          <div className="pt-16 px-8 pb-8 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{userName}</h2>
              <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px]">
                 {getRoleLabel(role)}
              </Badge>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-bold text-slate-700">{user?.email || "No email provided"}</p>
                  </div>
               </div>

               <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile Number</p>
                    <p className="text-sm font-bold text-slate-700">{user?.mobile || "No mobile provided"}</p>
                  </div>
               </div>

            </div>

            <Button onClick={() => setIsProfileOpen(false)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
              Close Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
