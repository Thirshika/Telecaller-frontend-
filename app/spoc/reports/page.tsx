"use client"

import { useState } from "react"
import {
  FileText,
  Search,
  Calendar,
  MapPin,
  School,
  BookOpen,
  Building2,
  Megaphone,
  Users,
  Eye,
  ChevronRight,
  Filter,
  Briefcase,
  Share2,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  ClipboardCheck
} from "lucide-react"
import { type FieldReport } from "@/lib/mock-data"

export default function SpocReportsPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<FieldReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [monthFilter, setMonthFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedReport, setSelectedReport] = useState<FieldReport | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [telecallers, setTelecallers] = useState<any[]>([])
  const [isRaisingTask, setIsRaisingTask] = useState(false)
  const [taskInstitution, setTaskInstitution] = useState("")
  const [taskAction, setTaskAction] = useState("")
  const [taskTelecaller, setTaskTelecaller] = useState("")

  useEffect(() => {
    const loadReports = async () => {
      if (!user) return
      try {
        const [reportsData, teleData] = await Promise.all([
          api.getFieldReports(user.id),
          api.getTelecallers()
        ])
        setReports(reportsData)
        setTelecallers(teleData)
      } catch (err) {
        console.error("Failed to load reports:", err)
      } finally {
        setLoading(false)
      }
    }
    loadReports()
  }, [user])

  const handleRaiseTask = async () => {
    if (!selectedReport || !taskInstitution || !taskAction || !taskTelecaller) return
    try {
      await api.createFollowUp({
        sourceReportId: selectedReport.id,
        assignedToRole: 'Telecaller',
        assignedToUser: taskTelecaller,
        institutionName: taskInstitution,
        actionDescription: taskAction,
        followUpDate: new Date().toISOString().split('T')[0],
        createdById: user.id
      })
      setIsRaisingTask(false)
      setTaskInstitution("")
      setTaskAction("")
      setTaskTelecaller("")
      // Maybe show a success toast?
    } catch (err) {
      console.error("Failed to raise task:", err)
    }
  }

  // Filter reports
  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.areaLocation
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    
    let matchesMonth = true
    if (monthFilter !== "all") {
      const reportMonth = new Date(report.reportDate).getMonth()
      matchesMonth = reportMonth === parseInt(monthFilter)
    }

    let matchesStatus = true
    if (statusFilter === "submitted") {
      matchesStatus = !report.isDraft
    } else if (statusFilter === "draft") {
      matchesStatus = report.isDraft
    }

    return matchesSearch && matchesMonth && matchesStatus
  })

  // Sort by most recent first
  const sortedReports = [...filteredReports].sort(
    (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
  )

  const handleViewDetails = (report: FieldReport) => {
    setSelectedReport(report)
    setIsDetailOpen(true)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Past Reports</h1>
        <p className="text-slate-500 font-medium">
          View all your submitted field reports and their outcomes
        </p>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-slate-200 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-full sm:w-40 h-12 border-slate-100 bg-slate-50/50 font-medium text-slate-600">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <SelectValue placeholder="All Months" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="all">All Months</SelectItem>
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, i) => (
                    <SelectItem key={month} value={i.toString()}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 h-12 border-slate-100 bg-slate-50/50 font-medium text-slate-600">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {sortedReports.length === 0 ? (
        <Card className="border-none shadow-sm bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <FileText className="h-10 w-10 opacity-40" />
            </div>
            <p className="text-lg font-bold">No reports found</p>
            <p className="text-sm">Try adjusting your filters or search terms</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedReports.map((report) => (
            <Card key={report.id} className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden bg-white" onClick={() => handleViewDetails(report)}>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-center p-6 gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-slate-100 flex flex-col items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <span className="text-xs font-bold uppercase opacity-60">
                      {new Date(report.reportDate).toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                    <span className="text-2xl font-black">
                      {new Date(report.reportDate).toLocaleDateString('en-IN', { day: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900">{report.areaLocation}</h3>
                      {report.isDraft && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Draft
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <School className="h-4 w-4 text-blue-500" />
                        <span>{report.schoolsVisited} Schools</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <BookOpen className="h-4 w-4 text-purple-500" />
                        <span>{report.coachingCentresVisited} Coaching</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <Building2 className="h-4 w-4 text-emerald-500" />
                        <span>{report.admissionCentresVisited} Admission</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <Button variant="ghost" className="rounded-full h-12 w-12 p-0 hover:bg-slate-100">
                      <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-slate-900 transition-colors" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Report Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] rounded-3xl border-none shadow-2xl overflow-hidden p-0">
          {selectedReport && (
            <div className="flex flex-col h-full bg-slate-50/50">
              <div className="p-8 bg-white border-b border-slate-100">
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Field Report Details</p>
                      <DialogTitle className="text-3xl font-black text-slate-900">
                        {selectedReport.areaLocation}
                      </DialogTitle>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {new Date(selectedReport.reportDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-none rounded-full px-3 py-1 font-bold">
                          Submitted
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <ScrollArea className="flex-1 p-8">
                <div className="space-y-8">
                  {/* Summary Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm bg-white p-6 text-center space-y-2">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto">
                        <School className="h-5 w-5 text-blue-500" />
                      </div>
                      <p className="text-3xl font-black text-slate-900">{selectedReport.schoolsVisited}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase">Schools</p>
                    </Card>
                    <Card className="border-none shadow-sm bg-white p-6 text-center space-y-2">
                      <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center mx-auto">
                        <BookOpen className="h-5 w-5 text-purple-500" />
                      </div>
                      <p className="text-3xl font-black text-slate-900">{selectedReport.coachingCentresVisited}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase">Coaching</p>
                    </Card>
                    <Card className="border-none shadow-sm bg-white p-6 text-center space-y-2">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto">
                        <Building2 className="h-5 w-5 text-emerald-500" />
                      </div>
                      <p className="text-3xl font-black text-slate-900">{selectedReport.admissionCentresVisited}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase">Admission</p>
                    </Card>
                  </div>

                  {/* Activities Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-900">Outreach Activities</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Local Branding', value: selectedReport.brandingDone, icon: Megaphone, color: 'orange' },
                        { label: 'Alumni Outreach', value: selectedReport.alumniOutreach, icon: Users, color: 'teal' },
                        { label: 'Corporate Outreach', value: selectedReport.corporateOutreach, icon: Briefcase, color: 'indigo' },
                        { label: 'Referral Network', value: selectedReport.referralNetwork, icon: Share2, color: 'pink' }
                      ].map((activity) => (
                        <div key={activity.label} className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                          activity.value ? "bg-white border-slate-100 shadow-sm" : "bg-slate-50 border-transparent opacity-60"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", activity.value ? `bg-${activity.color}-50 text-${activity.color}-500` : "bg-slate-200 text-slate-400")}>
                              <activity.icon className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-slate-700">{activity.label}</span>
                          </div>
                          {activity.value ? (
                            <Badge className="bg-emerald-500 text-white border-none rounded-full">Yes</Badge>
                          ) : (
                            <span className="text-xs font-bold text-slate-400 uppercase">No</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Follow-up Task Section */}
                  <Separator className="bg-slate-100" />
                  
                  {!isRaisingTask ? (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsRaisingTask(true);
                      }}
                      className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 flex items-center justify-center gap-2 mt-4"
                    >
                      <Plus className="h-5 w-5" />
                      Raise Follow-up Task
                    </Button>
                  ) : (
                    <div className="space-y-6 bg-white p-6 rounded-3xl border-2 border-slate-900/5 shadow-sm mt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                          <ClipboardCheck className="h-5 w-5 text-blue-500" />
                          Assign Follow-up Task
                        </h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsRaisingTask(false)}
                          className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                        >
                          Cancel
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Institution Name</Label>
                          <Input 
                            placeholder="e.g. Brilliant Coaching Centre"
                            value={taskInstitution}
                            onChange={(e) => setTaskInstitution(e.target.value)}
                            className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assign to Telecaller</Label>
                          <Select value={taskTelecaller} onValueChange={setTaskTelecaller}>
                            <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50">
                              <SelectValue placeholder="Select Telecaller" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                              {telecallers.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Action Required</Label>
                          <Textarea 
                            placeholder="Describe what needs to be done..."
                            value={taskAction}
                            onChange={(e) => setTaskAction(e.target.value)}
                            className="min-h-[100px] rounded-xl border-slate-100 bg-slate-50/50 resize-none"
                          />
                        </div>

                        <Button 
                          onClick={handleRaiseTask}
                          disabled={!taskInstitution || !taskAction || !taskTelecaller}
                          className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                        >
                          Assign Task
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
                <Button onClick={() => setIsDetailOpen(false)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-8 h-12">
                  Close Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
