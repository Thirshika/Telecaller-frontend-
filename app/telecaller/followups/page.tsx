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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { type FollowUpStatus, mockFieldReports } from "@/lib/mock-data"

const statusConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }
> = {
  Pending: {
    label: "Pending",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  Completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  Overdue: {
    label: "Overdue",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
}

export default function TelecallerFollowupsPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [followUps, setFollowUps] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFollowUp, setSelectedFollowUp] = useState<any | null>(null)
  const [resolutionNote, setResolutionNote] = useState("")
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const errorCount = useRef(0)

  const loadFollowUps = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const data = await api.getFollowUps(user.id)
      // Deduplicate by ID
      const uniqueTasks = Array.from(
        new Map(data.map((t: any) => [t.id, t])).values()
      )
      setFollowUps(uniqueTasks)
    } catch (err) {
      console.error("Failed to load tasks:", err)
      errorCount.current++
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadFollowUps()
      const intervalId = setInterval(() => {
        if (errorCount.current < 5) loadFollowUps()
      }, 30000)
      return () => clearInterval(intervalId)
    }
  }, [user?.id])

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

  const handleMarkComplete = (followUp: any) => {
    setSelectedFollowUp(followUp)
    setResolutionNote("")
    setIsCompleteDialogOpen(true)
  }

  const handleSubmitComplete = async () => {
    if (!selectedFollowUp) return

    try {
      await api.updateFollowUp(selectedFollowUp.id, {
        status: "Completed",
        resolutionNote
      })
      // Refresh local list
      await loadFollowUps()
      setIsCompleteDialogOpen(false)
      setSelectedFollowUp(null)
      setResolutionNote("")
    } catch (err) {
      console.error("Failed to complete task:", err)
    }
  }

  const handleDeleteFollowUp = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return
    try {
      await api.deleteFollowUp(id)
      await loadFollowUps()
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Follow-up Tasks</h1>
        <p className="text-muted-foreground">
          Tasks assigned to you from field agent reports
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="rounded-lg bg-yellow-100 p-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
              <div className="rounded-lg bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by institution or action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
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
        {sortedFollowUps.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mb-4 opacity-50" />
              <p>No follow-up tasks found</p>
            </CardContent>
          </Card>
        ) : (
          sortedFollowUps.map((followUp) => {
            const config = statusConfig[followUp.status]
            const Icon = config.icon

            return (
              <Card
                key={followUp.id}
                className={cn(
                  followUp.status === "Overdue" && "border-red-200 bg-red-50/30"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge
                          variant="outline"
                          className={cn(config.bgColor, config.color, "border-0 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider")}
                        >
                          <Icon className="h-3 w-3 mr-1.5" />
                          {config.label}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-2">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          Due: {new Date(followUp.followUpDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                          <Building2 className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-800 text-lg leading-tight">
                            {followUp.institutionName}
                          </h3>
                          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">
                            Assigned by: {followUp.creatorName || "Admin"}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-slate-500 font-medium ml-[52px] bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 italic">
                        &ldquo;{followUp.actionDescription}&rdquo;
                      </p>

                      {followUp.resolutionNote && (
                        <div className="mt-2 ml-6 p-2 rounded bg-green-50 border border-green-100">
                          <p className="text-xs text-green-700">
                            <strong>Resolution:</strong> {followUp.resolutionNote}
                          </p>
                        </div>
                      )}
                    </div>

                      <div className="flex flex-col items-end gap-2">
                        {followUp.status !== "Completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 h-9 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                            onClick={() => handleMarkComplete(followUp)}
                          >
                            <Check className="h-4 w-4 mr-1.5" />
                            Mark Complete
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 h-9 w-9 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50"
                          onClick={() => handleDeleteFollowUp(followUp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {sortedFollowUps.length} of {followUps.length} tasks
      </div>

      {/* Complete Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <div className="bg-slate-900 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </div>
                Complete Task
              </DialogTitle>
              <p className="text-slate-400 font-medium mt-2">
                Submit your resolution details to close this follow-up task.
              </p>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            {selectedFollowUp && (
              <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <p className="font-black text-slate-800">{selectedFollowUp.institutionName}</p>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed italic">
                  &ldquo;{selectedFollowUp.actionDescription}&rdquo;
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="resolution" className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">
                Resolution Note
              </Label>
              <Textarea
                id="resolution"
                placeholder="Describe how you completed this task..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-slate-200 transition-all resize-none p-4 font-medium"
              />
            </div>
          </div>

          <div className="p-8 bg-slate-50 flex gap-3 border-t border-slate-100">
            <Button 
              variant="outline" 
              onClick={() => setIsCompleteDialogOpen(false)}
              className="flex-1 h-12 rounded-2xl font-bold border-slate-200 hover:bg-white text-slate-600"
            >
              Discard
            </Button>
            <Button 
              onClick={handleSubmitComplete}
              className="flex-[2] h-12 rounded-2xl font-black bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200 transition-all hover:scale-[1.02] active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Complete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
