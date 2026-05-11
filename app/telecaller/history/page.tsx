"use client"

import { useState, useMemo, useEffect } from "react"
import {
  History,
  Search,
  Calendar,
  Phone,
  PhoneOff,
  Clock,
  XCircle,
  Ban,
  Globe,
  ThumbsUp,
  CheckCircle2,
  GraduationCap,
  Download,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { mockCourses } from "@/lib/mock-data"

const outcomeConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  NotAnswered: { label: "Not Answered", icon: PhoneOff, color: "text-orange-500" },
  Busy: { label: "Busy", icon: Phone, color: "text-yellow-500" },
  WrongNumber: { label: "Wrong Number", icon: XCircle, color: "text-red-500" },
  CallBack: { label: "Callback", icon: Clock, color: "text-blue-500" },
  NotInterested: { label: "Not Interested", icon: XCircle, color: "text-gray-500" },
  DNC: { label: "DNC", icon: Ban, color: "text-red-600" },
  LanguageBarrier: { label: "Language Barrier", icon: Globe, color: "text-amber-500" },
  Interested: { label: "Interested", icon: ThumbsUp, color: "text-green-500" },
  Qualified: { label: "Qualified", icon: CheckCircle2, color: "text-emerald-600" },
  EnrolledElsewhere: { label: "Enrolled Elsewhere", icon: GraduationCap, color: "text-purple-500" },
  VisitScheduled: { label: "Visit Scheduled", icon: CheckCircle2, color: "text-purple-600" },
  VisitDone: { label: "Visit Done", icon: CheckCircle2, color: "text-violet-600" },
  AdmissionDone: { label: "Admission Done", icon: GraduationCap, color: "text-emerald-600" },
  ReEngage: { label: "Re-Engage", icon: Phone, color: "text-indigo-500" },
}

export default function CallHistoryPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all")
  const [callLogs, setCallLogs] = useState<any[]>([])
  const [prospects, setProspects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      try {
        const [logs, pros] = await Promise.all([
          api.getCallLogs(user.id),
          api.getProspects()
        ])
        // Filter prospects and deduplicate
        const mappedProspects = Array.from(
          new Map(
            pros
              .filter((p: any) => p.assignedTo === user.id || p.assignedTo === null || p.assignedTo === "")
              .map((p: any) => [p.id, p])
          ).values()
        )

        // Deduplicate logs by ID
        const uniqueLogs = Array.from(
          new Map(logs.map((l: any) => [l.id, l])).values()
        )

        setCallLogs(uniqueLogs)
        setProspects(mappedProspects)
      } catch (err) {
        console.error("Failed to load history:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [user])

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = sortedHistory.map(call => {
      const config = outcomeConfig[call.outcome] || { label: call.outcome };
      return `
        <tr>
          <td>${new Date(call.calledAt).toLocaleString()}</td>
          <td>${call.prospectName}</td>
          <td>${call.prospectMobile}</td>
          <td>${call.prospectLocation}</td>
          <td>${config.label}</td>
          <td>${call.notes || '-'}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Call History Report - ${user?.name}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            .header { margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h1 { margin: 0; color: #000; }
            .meta { font-size: 12px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #fafafa; }
            @page { margin: 1cm; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Call History Report</h1>
            <div class="meta">Generated on: ${new Date().toLocaleString()} | Telecaller: ${user?.name}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Student Name</th>
                <th>Mobile</th>
                <th>Location</th>
                <th>Outcome</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm("Are you sure you want to delete this call log?")) return
    try {
      await api.deleteCallLog(logId)
      setCallLogs(prev => prev.filter(log => log.id !== logId))
    } catch (err) {
      console.error("Failed to delete call log:", err)
    }
  }

  const callHistoryWithDetails = useMemo(() => {
    // Keep only the latest call log for each prospect
    const latestCalls = new Map();
    for (const call of callLogs) {
      if (!latestCalls.has(call.prospectId)) {
        latestCalls.set(call.prospectId, call);
      }
    }
    
    return Array.from(latestCalls.values())
      .filter((call) => prospects.some((p) => p.id === call.prospectId))
      .map((call) => {
        const prospect = prospects.find((p) => p.id === call.prospectId)
        return {
          ...call,
          id: call.id,
          calledAt: call.calledAt,
          outcome: call.outcome,
          notes: call.notes,
          prospectName: prospect?.name || "Unknown",
          prospectMobile: prospect?.mobile || "",
          prospectLocation: prospect?.location || "",
          courseInterest: prospect?.courseInterest || "Unknown",
        }
      })
  }, [callLogs, prospects])

  // Filter call history
  const filteredHistory = callHistoryWithDetails.filter((call) => {
    const matchesSearch =
      call.prospectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.prospectMobile.includes(searchQuery)
    const matchesOutcome = outcomeFilter === "all" || call.outcome === outcomeFilter

    // Date filtering
    let matchesDate = true
    if (dateFilter !== "all") {
      const callDate = new Date(call.calledAt)
      const today = new Date()
      if (dateFilter === "today") {
        matchesDate = callDate.toDateString() === today.toDateString()
      } else if (dateFilter === "yesterday") {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        matchesDate = callDate.toDateString() === yesterday.toDateString()
      } else if (dateFilter === "week") {
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        matchesDate = callDate >= weekAgo
      } else if (dateFilter === "month") {
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        matchesDate = callDate >= monthAgo
      }
    }

    return matchesSearch && matchesOutcome && matchesDate
  })

  // Sort by most recent first
  const sortedHistory = [...filteredHistory].sort(
    (a, b) => new Date(b.calledAt).getTime() - new Date(a.calledAt).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Call History</h1>
          <p className="text-muted-foreground">
            View all your past call attempts and outcomes
          </p>
        </div>
        <Button variant="outline" onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                {Object.entries(outcomeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Call History Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Call Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <History className="h-8 w-8" />
                        <p>No call history found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedHistory.map((call) => {
                    const config = outcomeConfig[call.outcome] || { label: call.outcome, icon: Phone, color: "text-slate-400" }
                    const Icon = config.icon

                    return (
                      <TableRow key={call.id}>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {new Date(call.calledAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-muted-foreground">
                              {new Date(call.calledAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{call.prospectName}</p>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {call.courseInterest === "Unknown"
                                ? "Unknown"
                                : mockCourses.find(
                                    (c) =>
                                      c.code ===
                                      call.courseInterest.replace("Course", "")
                                  )?.code || call.courseInterest}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {call.prospectMobile}
                        </TableCell>
                        <TableCell>{call.prospectLocation}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4", config.color)} />
                            <span className="text-sm">{config.label}</span>
                          </div>
                          {call.callbackDatetime && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Callback:{" "}
                              {new Date(call.callbackDatetime).toLocaleString("en-IN", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="min-w-[200px]">
                          <p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-normal">
                            {call.notes || "-"}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteLog(call.id)}
                            title="Delete call log"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {sortedHistory.length} of {callHistoryWithDetails.length} calls
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
