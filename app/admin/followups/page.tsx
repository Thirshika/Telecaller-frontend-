"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  History, 
  Clock, 
  User, 
  Phone, 
  ClipboardList, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Calendar,
  Search,
  MessageSquare,
  ShieldCheck,
  UserCheck
} from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  Pending: { 
    label: "Pending", 
    color: "text-yellow-600", 
    bgColor: "bg-yellow-50",
    icon: Clock 
  },
  Completed: { 
    label: "Completed", 
    color: "text-emerald-600", 
    bgColor: "bg-emerald-50",
    icon: CheckCircle2 
  },
  Overdue: { 
    label: "Overdue", 
    color: "text-red-600", 
    bgColor: "bg-red-50",
    icon: AlertTriangle 
  },
}

export default function AdminFollowupsPage() {
  const [followUps, setFollowUps] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const loadData = useCallback(async () => {
    try {
      const [tasks, allUsers] = await Promise.all([
        api.getAllFollowUps(),
        api.getUsers()
      ])
      setFollowUps(tasks)
      setUsers(allUsers)
    } catch (err) {
      console.error("Failed to load follow-ups:", err)
      toast.error("Failed to load tracking data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredTasks = useMemo(() => {
    return followUps.filter(task => {
      const matchesSearch = 
        task.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.actionDescription.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === "all" || task.assignedToRole === roleFilter
      const matchesStatus = statusFilter === "all" || task.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [followUps, searchQuery, roleFilter, statusFilter])

  const getUserName = (id: string) => {
    return users.find(u => u.id === id)?.name || "Unknown User"
  }

  const stats = {
    total: followUps.length,
    pending: followUps.filter(t => t.status === "Pending").length,
    completed: followUps.filter(t => t.status === "Completed").length,
    overdue: followUps.filter(t => t.status === "Overdue").length,
  }

  if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Initializing System Tracking...</div>

  return (
    <div className="p-8 space-y-10 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">System Follow-ups</h1>
        <p className="text-slate-500 text-lg font-medium">
          Master tracking of all follow-up tasks across SPOCs and Telecallers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-slate-900">{stats.total}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Tasks</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4">
                <ClipboardList className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="h-1.5 bg-blue-500" />
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-slate-900">{stats.pending}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active / Pending</p>
              </div>
              <div className="rounded-2xl bg-yellow-50 p-4">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
            <div className="h-1.5 bg-yellow-500" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_8px_30_rgb(0,0,0,0.04)] bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-red-600">{stats.overdue}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Critical Overdue</p>
              </div>
              <div className="rounded-2xl bg-red-50 p-4">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="h-1.5 bg-red-500" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-emerald-600">{stats.completed}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Resolved Result</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
            <div className="h-1.5 bg-emerald-500" />
          </CardContent>
        </Card>
      </div>

      {/* Filters Area */}
      <Card className="border-none shadow-sm bg-white p-3 rounded-[32px]">
        <CardContent className="p-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by institution, student or action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 h-14 rounded-2xl border-none bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all font-medium"
              />
            </div>
            <div className="flex gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48 h-14 rounded-2xl border-none bg-slate-50/50 font-bold text-slate-600">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Telecaller">Telecallers</SelectItem>
                  <SelectItem value="SPOC">Field Agents (SPOC)</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44 h-14 rounded-2xl border-none bg-slate-50/50 font-bold text-slate-600">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[40px] overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none">
                <TableHead className="pl-10 py-6 font-black text-slate-400 text-[11px] uppercase tracking-[0.1em]">Target Entity</TableHead>
                <TableHead className="py-6 font-black text-slate-400 text-[11px] uppercase tracking-[0.1em]">Action Requirement</TableHead>
                <TableHead className="py-6 font-black text-slate-400 text-[11px] uppercase tracking-[0.1em]">Assigned To</TableHead>
                <TableHead className="py-6 font-black text-slate-400 text-[11px] uppercase tracking-[0.1em]">Timeline</TableHead>
                <TableHead className="py-6 font-black text-slate-400 text-[11px] uppercase tracking-[0.1em]">Resolution Result</TableHead>
                <TableHead className="pr-10 py-6 font-black text-slate-400 text-[11px] uppercase tracking-[0.1em] text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-96 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-200">
                      <ClipboardList className="h-16 w-16 opacity-20" />
                      <p className="text-xl font-bold">No follow-up records found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => {
                  const config = statusConfig[task.status] || statusConfig.Pending
                  const StatusIcon = config.icon
                  
                  return (
                    <TableRow key={task.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors group">
                      <TableCell className="pl-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200/50">
                            <Building2 className="h-6 w-6 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                              {task.institutionName}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              ID: {task.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="max-w-xs">
                        <div className="flex gap-2 items-start">
                           <MessageSquare className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                           <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                             &ldquo;{task.actionDescription}&rdquo;
                           </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-2">
                           <div className="flex items-center gap-2">
                              <Badge variant="outline" className={cn(
                                "border-0 font-bold px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider",
                                task.assignedToRole === "Telecaller" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                              )}>
                                {task.assignedToRole}
                              </Badge>
                           </div>
                           <div className="flex items-center gap-2">
                              <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                              <span className="text-sm font-bold text-slate-700">{getUserName(task.assignedToUser)}</span>
                           </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                              <Calendar className="h-3.5 w-3.5" />
                              Due: {new Date(task.followUpDate).toLocaleDateString()}
                           </div>
                           {task.status === "Completed" && task.updatedAt && (
                              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500">
                                 <CheckCircle2 className="h-3.5 w-3.5" />
                                 Done: {new Date(task.updatedAt).toLocaleDateString()}
                              </div>
                           )}
                        </div>
                      </TableCell>

                      <TableCell className="max-w-md">
                        {task.status === "Completed" ? (
                          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                             <p className="text-sm font-bold text-emerald-800 leading-relaxed">
                                {task.resolutionNote || "Completed with no specific notes."}
                             </p>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-300 italic">No result yet...</span>
                        )}
                      </TableCell>

                      <TableCell className="pr-10 text-right">
                        <Badge className={cn(
                          config.bgColor, 
                          config.color, 
                          "border-0 font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest inline-flex items-center gap-2"
                        )}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] text-center pt-8 pb-10">
        Global Task Management &bull; System Administrator View
      </div>
    </div>
  )
}
