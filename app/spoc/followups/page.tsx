"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  ClipboardList,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  Plus,
  ArrowRight,
  ClipboardCheck,
  Building,
  User,
  MessageSquare,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

const statusConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }
> = {
  Pending: {
    label: "Pending",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  Completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  Overdue: {
    label: "Overdue",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
}

export default function SpocFollowupsPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [followUps, setFollowUps] = useState<any[]>([])
  const [telecallers, setTelecallers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const errorCount = useRef(0)

  const loadData = async (isSilent = false) => {
    if (!user?.id) return
    if (!isSilent) setIsLoading(true)
    try {
      const [tasksData, teleData] = await Promise.all([
        api.getSpocFollowUps(user.id),
        api.getTelecallers(),
      ])

      const spocTasks = tasksData.map((t: any) => ({ ...t, type: 'SPOC_TASK' }))
      
      setFollowUps(spocTasks)
      setTelecallers(teleData)
      errorCount.current = 0 // Reset on success
    } catch (err) {
      console.error("Failed to load data:", err)
      errorCount.current++
    } finally {
      if (!isSilent) setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadData()
      // Live updates polling for task tracking
      const intervalId = setInterval(() => {
        if (errorCount.current < 5) loadData(true)
      }, 30000) // 30s polling
      return () => clearInterval(intervalId)
    }
  }, [user?.id])

  if (isAuthLoading || (isLoading && !user?.id)) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-medium">
        <Clock className="h-5 w-5 animate-spin mr-2" />
        Loading your tasks...
      </div>
    )
  }

  // Filter follow-ups
  const filteredFollowUps = followUps.filter((fu) => {
    const matchesSearch =
      fu.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fu.actionDescription.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || fu.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Sort: Overdue first, then Pending, then Completed
  const sortedFollowUps = useMemo(() => {
    return [...filteredFollowUps].sort((a, b) => {
      const statusOrder: Record<string, number> = {
        Overdue: 0,
        Pending: 1,
        Completed: 2,
      }
      return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3)
    })
  }, [filteredFollowUps])

  const handleDeleteFollowUp = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return
    try {
      await api.deleteFollowUp(id)
      await loadData()
    } catch (err) {
      console.error("Failed to delete task:", err)
    }
  }

  // Stats
  const stats = {
    total: followUps.length,
    pending: followUps.filter((fu) => fu.status === "Pending").length,
    overdue: followUps.filter((fu) => fu.status === "Overdue").length,
    completed: followUps.filter((fu) => fu.status === "Completed").length,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Task Tracking</h1>
          <p className="text-muted-foreground">
            Monitor follow-up tasks assigned to telecallers
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Updates</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900">{stats.total}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Assigned</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <ClipboardList className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="h-1 bg-blue-500" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900">{stats.pending}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Progress</p>
              </div>
              <div className="rounded-xl bg-yellow-50 p-3">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
            <div className="h-1 bg-yellow-500" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-red-600">{stats.overdue}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Needs Attention</p>
              </div>
              <div className="rounded-xl bg-red-50 p-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <div className="h-1 bg-red-500" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-green-600">{stats.completed}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resolved</p>
              </div>
              <div className="rounded-xl bg-green-50 p-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="h-1 bg-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm bg-white p-2 rounded-2xl">
        <CardContent className="p-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search by institution or action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 h-12 rounded-xl border-none bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all outline-none text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-12 rounded-xl border-none bg-slate-50/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
             <div className="h-12 w-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
             <p className="font-bold">Loading tasks...</p>
          </div>
        ) : sortedFollowUps.length === 0 ? (
          <Card className="border-none shadow-sm bg-slate-50/50 rounded-[32px]">
            <CardContent className="flex flex-col items-center justify-center py-24 text-slate-400">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                <ClipboardList className="h-10 w-10 opacity-30" />
              </div>
              <p className="text-lg font-bold">No assigned tasks</p>
              <p className="text-sm">Tasks assigned to telecallers will appear here for tracking</p>
            </CardContent>
          </Card>
        ) : (
          sortedFollowUps.map((followUp) => {
            const config = statusConfig[followUp.status] || statusConfig.Pending
            const Icon = config.icon
            const assignedTC = telecallers.find(t => t.id === followUp.assignedToUser)

            return (
              <Card
                key={followUp.id}
                className={cn(
                  "border-none shadow-sm transition-all hover:shadow-md rounded-3xl overflow-hidden bg-white",
                  followUp.status === "Overdue" && "bg-red-50/20"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-4">
                          <Badge
                            variant="outline"
                            className={cn(config.bgColor, config.color, "border-0 font-bold px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider")}
                          >
                            <Icon className="h-3 w-3 mr-2" />
                            {config.label}
                          </Badge>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none text-[9px] font-black uppercase tracking-tighter">
                            {followUp.type === 'STUDENT_CALLBACK' ? 'Student Callback' : 'SPOC Task'}
                          </Badge>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-blue-500" />
                            Target: {new Date(followUp.followUpDate).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200/50">
                            <Building className="h-6 w-6 text-slate-400" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800 text-xl leading-tight">
                              {followUp.institutionName}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              Task ID: {followUp.id.slice(0, 8)} | Raised by: {followUp.creatorName || "Admin"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
                           <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-500" />
                           </div>
                           <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Assigned To</p>
                              <p className="text-xs font-bold text-slate-700 mt-1">{assignedTC?.name || "Unassigned"}</p>
                           </div>
                        </div>
                      </div>

                      <div className="sm:text-right">
                          <div className="flex items-center gap-2">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Instruction</p>
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50 -mt-2"
                               onClick={() => handleDeleteFollowUp(followUp.id)}
                             >
                               <Trash2 className="h-3.5 w-3.5" />
                             </Button>
                          </div>
                          <p className="text-sm text-slate-600 font-medium italic leading-relaxed break-words whitespace-normal">
                             &ldquo;{followUp.actionDescription}&rdquo;
                          </p>
                      </div>
                    </div>

                    {followUp.status === "Completed" && (
                      <div className="p-5 rounded-[24px] bg-emerald-50 border border-emerald-100 space-y-3">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Resolution Result</span>
                           </div>
                           <span className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">
                              {new Date(followUp.updatedAt).toLocaleDateString()}
                           </span>
                        </div>
                        <p className="text-sm text-emerald-800 font-medium leading-relaxed">
                          {followUp.resolutionNote || "Completed without notes."}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-center pt-8 pb-12">
        Course Enrollment Management System &bull; Task Tracking Module
      </div>
    </div>
  )
}
