"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  Phone,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  PhoneCall,
  History,
} from "lucide-react"
import { CallHistoryModal } from "@/components/call-history-modal"
import { PurposeNotesModal } from "@/components/purpose-notes-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CallOutcomeModal, purposeOptions } from "@/components/call-outcome-modal"
import { ScheduleCallModal } from "@/components/schedule-call-modal"
import { cn } from "@/lib/utils"
import {
  type Prospect,
  type ProspectStatus,
  type CallOutcome,
  telecallerStats,
  mockCourses,
} from "@/lib/mock-data"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

// Map backend status strings to frontend ProspectStatus types
function mapBackendStatus(status: string): string {
  const map: Record<string, string> = {
    "not_answered": "Not Answered",
    "busy": "Busy",
    "invalid": "Invalid",
    "callback": "Callback",
    "not_interested": "Not Interested",
    "dnc": "DNC",
    "language_issue": "Language Issue",
    "interested": "Interested",
    "qualified": "Qualified",
    "visit_scheduled": "Visit Scheduled",
    "visit_done": "Visit Done",
    "admission_done": "Admission Done",
    "callback_scheduled": "Callback Scheduled",
  }
  return map[status] || status
}

function getStage(status: string): string {
  const s = status.toLowerCase()
  if (["qualified", "visit scheduled", "visit done", "admission done"].includes(s)) return "Hot"
  if (["callback", "callback scheduled", "interested"].includes(s)) return "Warm"
  if (["lost", "enrolledelsewhere"].includes(s)) return "Lost"
  return "Cold"
}

const stageColors: Record<string, string> = {
  "Hot": "bg-red-100 text-red-700 border-red-200 font-bold",
  "Warm": "bg-orange-100 text-orange-700 border-orange-200 font-bold",
  "Cold": "bg-blue-100 text-blue-700 border-blue-200 font-bold",
  "Lost": "bg-gray-100 text-gray-700 border-gray-200 font-bold",
}

const statusColors: Record<string, string> = {
  "Not Answered": "bg-orange-100 text-orange-700 border-orange-200",
  "Busy": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Invalid": "bg-red-100 text-red-700 border-red-200",
  "Callback": "bg-blue-100 text-blue-700 border-blue-200",
  "Not Interested": "bg-gray-100 text-gray-700 border-gray-200",
  "DNC": "bg-red-200 text-red-800 border-red-300",
  "Language Issue": "bg-amber-100 text-amber-700 border-amber-200",
  "Interested": "bg-green-100 text-green-700 border-green-200",
  "Qualified": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Visit Scheduled": "bg-purple-100 text-purple-700 border-purple-200",
  "Visit Done": "bg-violet-100 text-violet-700 border-violet-200",
  "Admission Done": "bg-green-200 text-green-800 border-green-300 rounded-full",
  "New": "bg-blue-50 text-blue-600 border-blue-100",
  "Callback Scheduled": "bg-orange-100 text-orange-700 border-orange-200",
  "Called": "bg-blue-100 text-blue-700 border-blue-200",
}

export default function TelecallerDashboard() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [courseFilter, setCourseFilter] = useState<string>("all")
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const errorCount = useRef(0)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isPurposeNotesModalOpen, setIsPurposeNotesModalOpen] = useState(false)
  const [pendingPurpose, setPendingPurpose] = useState("")
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [scheduledProspect, setScheduledProspect] = useState<Prospect | null>(null)

  // Calculate dynamic stats from real prospects
  const stats = [
    {
      title: "Today's Prospects",
      value: prospects.length,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Called",
      value: prospects.filter(p => p.status !== 'New').length,
      icon: Phone,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Pending",
      value: prospects.filter(p => p.status === 'New').length,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Callbacks Due",
      value: prospects.filter(p => p.status === 'Callback' || p.status === 'callback' || p.status === 'Callback Scheduled').length,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Qualified",
      value: prospects.filter(p => p.status === "Qualified").length,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ]

  const loadProspects = async () => {
    setIsLoadingData(true)
    try {
      const data = await api.getProspects()
      // Map backend statuses and filter by assigned telecaller OR common pool (null)
      const mapped = data
        .filter((p: any) => p.assignedTo === user?.id || p.assignedTo === null || p.assignedTo === "")
      
      // Deduplicate by ID to prevent React key errors
      const uniqueProspects = Array.from(
        new Map(mapped.map((p: any) => [p.id, p])).values()
      )
      
      setProspects(uniqueProspects.map((p: any) => ({
        ...p,
        status: mapBackendStatus(p.status),
        courseInterest: p.courseInterest || "Unknown",
        lastCallAt: p.lastCallAt || null,
        nextCallDate: p.nextCallDate || null,
        nextCallTime: p.nextCallTime || null,
      })))
    } catch (err) {
      console.error("Failed to load prospects:", err)
      errorCount.current++
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadProspects()
      const intervalId = setInterval(() => {
        if (errorCount.current < 5) loadProspects()
      }, 30000)
      return () => clearInterval(intervalId)
    }
  }, [user?.id])

  // Sort prospects: Callback due first, then pending, then completed
  const sortedProspects = useMemo(() => {
    return [...prospects].sort((a, b) => {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0')

      const isADue = (a.status === "Callback Scheduled" || a.status === "Callback" || a.status === "callback") && a.nextCallDate === today && a.nextCallTime && a.nextCallTime <= currentTime
      const isBDue = (b.status === "Callback Scheduled" || b.status === "Callback" || b.status === "callback") && b.nextCallDate === today && b.nextCallTime && b.nextCallTime <= currentTime

      if (isADue && !isBDue) return -1
      if (!isADue && isBDue) return 1

      const statusOrder: Record<string, number> = {
        "Callback Scheduled": 0,
        "New": 1,
        "Interested": 2,
        "Qualified": 3,
        "Visit Scheduled": 4,
        "Visit Done": 5,
        "Admission Done": 6,
        "Not Answered": 7,
        "Busy": 8,
        "Callback": 9,
        "Not Interested": 10,
        "DNC": 11,
        "Invalid": 12,
        "Language Issue": 13,
      }

      const orderA = statusOrder[a.status] ?? 100
      const orderB = statusOrder[b.status] ?? 100

      if (orderA !== orderB) return orderA - orderB
      
      // Secondary sort: Next call time for scheduled ones
      if (a.status === "Callback Scheduled" && b.status === "Callback Scheduled") {
        if (a.nextCallDate !== b.nextCallDate) return (a.nextCallDate || "").localeCompare(b.nextCallDate || "")
        return (a.nextCallTime || "").localeCompare(b.nextCallTime || "")
      }

      return a.name.localeCompare(b.name)
    })
  }, [prospects])

  // Filter prospects
  const filteredProspects = useMemo(() => {
    return sortedProspects.filter((prospect) => {
      const matchesSearch =
        prospect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prospect.mobile.includes(searchQuery)
      const normalize = (s: string) => s.toLowerCase().replace(/_/g, ' ');
      const matchesStatus = statusFilter === "all" || 
        normalize(prospect.status) === normalize(statusFilter);
      const matchesCourse =
        courseFilter === "all" || prospect.courseInterest === courseFilter
      return matchesSearch && matchesStatus && matchesCourse
    })
  }, [sortedProspects, searchQuery, statusFilter, courseFilter])

  const handleCallNow = useCallback((prospect: Prospect) => {
    console.log(`>>> OPENING MODAL FOR: ${prospect.name} (${prospect.id})`)
    setSelectedProspect(prospect)
    setIsModalOpen(true)
  }, [])

  const handleScheduleCall = useCallback((prospect: Prospect) => {
    setScheduledProspect(prospect)
    setIsScheduleModalOpen(true)
  }, [])

  const handleScheduleSave = useCallback(async (data: {
    nextCallDate: string
    nextCallTime: string
    remarks: string
    followupStatus: string
  }) => {
    if (!scheduledProspect) return

    try {
      await api.updateProspect(scheduledProspect.id, {
        status: "callback_scheduled",
        assignedTo: user?.id,
        nextCallDate: data.nextCallDate,
        nextCallTime: data.nextCallTime,
        remarks: data.remarks,
        followupStatus: data.followupStatus
      })
      
      // Also log it
      await api.createCallLog({
        prospectId: scheduledProspect.id,
        telecallerId: user?.id,
        outcome: "CallBack",
        notes: data.remarks || "Scheduled call back",
      })

      loadProspects()
    } catch (err) {
      console.error("Failed to schedule call:", err)
    }
  }, [scheduledProspect, user?.id, loadProspects])

  // Reminders for scheduled calls
  const dueReminders = useMemo(() => {
    const now = new Date()
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0')
    const today = now.toISOString().split('T')[0]

    const due = prospects.filter(p => 
      p.nextCallDate === today && 
      p.nextCallTime && 
      p.nextCallTime.substring(0, 5) <= currentTime &&
      (p.status === "Callback Scheduled" || p.status === "Callback" || p.status === "callback")
    )

    if (due.length === 0) return null
    return `You have ${due.length} calls scheduled right now.`
  }, [prospects])

  const handleOutcomeSubmit = useCallback(async (prospectId: string, outcome: CallOutcome, data: Record<string, unknown>) => {
    // 1. Find current data for mapping and logging
    const targetProspect = prospects.find(p => p.id === prospectId)
    if (!targetProspect) return

    console.log(`>>> INITIATING SAVE: ${targetProspect.name} (ID: ${prospectId})`)

    // 2. Close modal immediately
    setIsModalOpen(false)

    // 3. Determine next status (Exact Mapping)
    let nextStatus: string = "Called" // Default to Called if a call was made
    switch (outcome) {
      case "NotAnswered": nextStatus = "not_answered"; break
      case "Busy": nextStatus = "busy"; break
      case "WrongNumber": nextStatus = "invalid"; break
      case "CallBack": nextStatus = "callback_scheduled"; break
      case "NotInterested": nextStatus = "not_interested"; break
      case "DNC": nextStatus = "dnc"; break
      case "LanguageBarrier": nextStatus = "language_issue"; break
      case "Interested": nextStatus = "interested"; break
      case "Qualified": nextStatus = "qualified"; break
      case "VisitScheduled": nextStatus = "visit_scheduled"; break
      case "VisitDone": nextStatus = "visit_done"; break
      case "AdmissionDone": nextStatus = "admission_done"; break
    }

    const now = new Date().toISOString()
    
    // 4. Update local state INSTANTLY
    setProspects(prev => prev.map(p => 
      p.id === prospectId ? { 
        ...p, 
        status: mapBackendStatus(nextStatus), 
        lastCallAt: now,
        nextCallDate: outcome === "CallBack" ? (data.callbackDate as string) : null,
        nextCallTime: outcome === "CallBack" ? (data.callbackTime as string) : null 
      } : p
    ))

    try {
      // 5. Update backend
      await api.updateProspect(prospectId, {
        status: nextStatus,
        lastCallAt: now,
        assignedTo: user?.id,
        nextCallDate: outcome === "CallBack" ? (data.callbackDate as string) : null,
        nextCallTime: outcome === "CallBack" ? (data.callbackTime as string) : null,
        ...data
      })

      // 5b. Create a Call Log for tracking performance
      await api.createCallLog({
        prospectId,
        telecallerId: user?.id,
        outcome: outcome,
        notes: (data.notes as string) || "",
        coursePreference: (data.courseConfirmed as string) || ""
      })

      console.log(`>>> SAVE SUCCESSFUL: ${targetProspect.name}`)
      
      // 6. Refresh data to ensure full sync (using the standard deduplicated loader)
      await loadProspects()
    } catch (err) {
      console.error("Failed to save call outcome:", err)
      // Optional: Rollback local state if save failed
    } finally {
      setSelectedProspect(null)
    }
  }, [prospects])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground flex items-center gap-1.5">
            Welcome back! You have 
            {(() => {
              const today = new Date().toISOString().split('T')[0];
              const dueCount = prospects.filter(p => 
                p.status === 'New' || 
                ((p.status === 'Callback Scheduled' || p.status === 'Callback' || p.status === 'callback') && p.nextCallDate && p.nextCallDate <= today)
              ).length;
              return (
                <span className={cn("font-black", dueCount > 0 ? "text-red-600" : "text-slate-900")}>
                  {dueCount}
                </span>
              );
            })()}
            prospects to call today.
          </p>
          {dueReminders && (
            <div className="mt-2 flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1.5 rounded-lg border border-orange-200 text-sm animate-pulse">
              <AlertCircle className="h-4 w-4" />
              <span className="font-semibold">{dueReminders}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Auto-sync active</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full bg-background shadow-sm hover:bg-muted"
            onClick={() => loadProspects()}
            disabled={isLoadingData}
          >
            <Clock className={cn("h-3.5 w-3.5 mr-2", isLoadingData && "animate-spin")} />
            {isLoadingData ? "Syncing..." : "Sync Now"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("rounded-lg p-2", stat.bgColor)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prospects List */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Today&apos;s Prospects</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {mockCourses.map((course) => (
                    <SelectItem key={course.id} value={`Course${course.code.charAt(0)}`}>
                      {course.code}
                    </SelectItem>
                  ))}
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Action</TableHead>
                  <TableHead>Next Call</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingData ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p>Loading prospects...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProspects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-8 w-8" />
                        <p>No prospects found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProspects.map((prospect, index) => (
                    <TableRow
                      key={`prospect-row-${prospect.id}`}
                      className={cn(
                        (prospect.status === "Callback" || prospect.status === "Callback Scheduled") && "bg-orange-50/50"
                      )}
                    >
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{prospect.name}</span>
                          {prospect.status === "Callback" &&
                            prospect.callbackDateTime && (
                              <span className="text-xs text-orange-600 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Callback at{" "}
                                {new Date(prospect.callbackDateTime).toLocaleTimeString(
                                  "en-IN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {prospect.mobile}
                      </TableCell>
                      <TableCell>{prospect.location}</TableCell>
                      <TableCell className="min-w-[250px] align-top">
                        <div className="flex items-center gap-2">
                          <div 
                            className="flex flex-col gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group/purpose w-full"
                            onClick={() => {
                              setSelectedProspect(prospect);
                              setPendingPurpose(prospect.purposeOfCall || "");
                              setIsPurposeNotesModalOpen(true);
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <Select 
                                value={prospect.purposeOfCall || ""} 
                                onValueChange={(v) => {
                                  setSelectedProspect(prospect);
                                  setPendingPurpose(v);
                                  setIsPurposeNotesModalOpen(true);
                                }}
                              >
                                <SelectTrigger 
                                  className="h-7 text-[10px] font-bold uppercase bg-blue-50 text-blue-600 border-none focus:ring-0 w-auto min-w-[100px] px-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SelectValue placeholder="SET PURPOSE" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                  {purposeOptions.map(opt => (
                                    <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <History className="h-3 w-3 text-slate-300 group-hover/purpose:text-blue-500 transition-colors" />
                            </div>
                            
                            {prospect.lastCallNotes ? (
                              <p className="text-xs text-slate-600 leading-relaxed font-medium break-words whitespace-normal">
                                {prospect.lastCallNotes}
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic font-medium">
                                Click to add description...
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(stageColors[getStage(prospect.status)])}
                        >
                          {getStage(prospect.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(statusColors[prospect.status])}
                        >
                          {prospect.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {prospect.lastCallAt
                          ? new Date(prospect.lastCallAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: true,
                            })
                          : "Not called"}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {prospect.nextCallDate ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-primary">
                              {new Date(prospect.nextCallDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {prospect.nextCallTime ? (
                                (() => {
                                  const [h, m] = prospect.nextCallTime.split(':');
                                  const hours = parseInt(h);
                                  const ampm = hours >= 12 ? 'PM' : 'AM';
                                  const h12 = hours % 12 || 12;
                                  return `${h12}:${m} ${ampm}`;
                                })()
                              ) : "—"}
                            </span>
                          </div>
                        ) : prospect.lastCallAt ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 font-bold text-[10px] py-0 px-2 rounded-full">
                            CALLED
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleScheduleCall(prospect)}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Schedule
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleCallNow(prospect)}
                            disabled={
                              prospect.status === "DNC" ||
                              prospect.status === "Qualified" ||
                              prospect.status === "Enrolled"
                            }
                          >
                            <PhoneCall className="h-4 w-4 mr-1" />
                            Call Now
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredProspects.length} of {prospects.length} prospects
          </div>
        </CardContent>
      </Card>

      {/* Call Outcome Modal */}
      <CallOutcomeModal
        key={selectedProspect ? `outcome-${selectedProspect.id}` : 'outcome-none'}
        prospect={selectedProspect}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleOutcomeSubmit}
      />

      <ScheduleCallModal
        key={scheduledProspect ? `schedule-${scheduledProspect.id}` : 'schedule-none'}
        prospect={scheduledProspect}
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        onSave={handleScheduleSave}
      />
      <CallHistoryModal
        key={selectedProspect ? `history-${selectedProspect.id}` : 'history-none'}
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false)
          setSelectedProspect(null)
        }}
        prospect={selectedProspect}
      />
      <PurposeNotesModal
        key={selectedProspect ? `purpose-${selectedProspect.id}` : 'purpose-none'}
        isOpen={isPurposeNotesModalOpen}
        onClose={() => setIsPurposeNotesModalOpen(false)}
        prospect={selectedProspect}
        purpose={pendingPurpose}
        onSave={async (notes) => {
          if (!selectedProspect) return;
          try {
            await api.updateProspect(selectedProspect.id, { 
              purposeOfCall: pendingPurpose,
              lastCallNotes: notes,
              assignedTo: user?.id
            });
            await api.createCallLog({
              prospectId: selectedProspect.id,
              telecallerId: user?.id,
              outcome: "Purpose Update", 
              notes: notes,
            });
            setProspects(prev => prev.map(p => p.id === selectedProspect.id ? { ...p, purposeOfCall: pendingPurpose, lastCallNotes: notes } : p));
            setIsPurposeNotesModalOpen(false);
          } catch (err) {
            console.error("Failed to save purpose and notes:", err);
          }
        }}
      />
    </div>
  )
}
