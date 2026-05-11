"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Phone,
  PhoneCall,
  Users,
  Clock,
  Ban,
  CheckCircle2,
  Calendar,
  Download,
  TrendingUp,
  Search,
  ChevronRight,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
} from "recharts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Mail, MapPin, School as SchoolIcon, BookOpen, Clock as ClockIcon, Calendar as CalendarIcon } from "lucide-react"

export default function TelecallerPerformancePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [prospects, setProspects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedProspect, setSelectedProspect] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const loadData = async () => {
    try {
      const [statsData, prospectsData] = await Promise.all([
        api.getSpocStats(user?.id),
        api.getProspects()
      ])
      setStats(statsData)
      setProspects(prospectsData)
    } catch (err) {
      console.error("Failed to load data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (prospect: any) => {
    setSelectedProspect(prospect)
    setIsDetailOpen(true)
  }

  const filteredProspects = useMemo(() => {
    const normalize = (s: string) => s.toLowerCase().replace(/_/g, ' ');
    if (filterStatus === "all") return prospects
    if (filterStatus === "connected") {
      const connectedStatuses = ['interested', 'qualified', 'callback', 'not_interested', 'dnc', 'visit scheduled', 'visit done', 'admission done']
      return prospects.filter(p => connectedStatuses.includes(normalize(p.status)))
    }
    return prospects.filter(p => normalize(p.status) === normalize(filterStatus))
  }, [prospects, filterStatus])

  const chartData = useMemo(() => {
    if (!stats?.globalBreakdown) return []
    
    const raw = stats.globalBreakdown;

    // Group related outcomes into the 5 display categories
    const data = [
      { 
        name: "Connected", 
        value: (raw.Interested || 0) + (raw.interested || 0) + (raw.VisitScheduled || 0) + (raw.VisitDone || 0) + (raw.AdmissionDone || 0) + (raw.ReEngage || 0), 
        color: "#10b981" 
      },
      { 
        name: "Call Back Later", 
        value: (raw.CallBack || 0) + (raw.callback || 0) + (raw.Busy || 0) + (raw.busy || 0), 
        color: "#3b82f6" 
      },
      { 
        name: "Qualified", 
        value: (raw.Qualified || 0) + (raw.qualified || 0), 
        color: "#8b5cf6" 
      },
      { 
        name: "Not Answered", 
        value: (raw.NotAnswered || 0) + (raw.not_answered || 0) + (raw.WrongNumber || 0) + (raw.LanguageBarrier || 0), 
        color: "#f59e0b" 
      },
      { 
        name: "DNC", 
        value: (raw.DNC || 0) + (raw.dnc || 0) + (raw.NotInterested || 0) + (raw.EnrolledElsewhere || 0), 
        color: "#ef4444" 
      },
    ]
    
    return data;
  }, [stats])

  const totalCalls = stats?.totalCallsToday || 0
  const connectedCalls = stats?.globalConnected || 0
  const totalProspects = stats?.totalLeads || 0
  const qualifiedCount = stats?.globalQualified || 0
  const dncCount = stats?.globalDnc || 0
  
  // Calculate percentages
  const connectedRate = totalCalls > 0 ? ((connectedCalls / totalCalls) * 100).toFixed(1) : "0.0"
  const dncRate = totalCalls > 0 ? ((dncCount / totalCalls) * 100).toFixed(1) : "0.0"
  const qualifiedRate = totalCalls > 0 ? ((qualifiedCount / totalCalls) * 100).toFixed(1) : "0.0"

  return (
    <div className="p-8 lg:p-12 space-y-8 max-w-[1600px] mx-auto bg-[#f8fafc] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#1e293b]">Telecaller Performance</h1>
          <p className="text-slate-500 text-lg mt-1 font-medium">Monitor telecaller activities and performance in real time.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="w-[200px] h-11 rounded-xl bg-white border-slate-200 shadow-sm font-semibold text-slate-600">
              <SelectValue placeholder="All Telecallers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Telecallers</SelectItem>
              {stats?.teamPerformance?.map((tc: any) => (
                <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5">
        {[
          { label: "Total Calls", value: totalCalls, sub: "All Time", icon: Phone, color: "blue", bgColor: "bg-blue-50", iconColor: "text-blue-500", status: "all" },
          { label: "Connected Calls", value: connectedCalls, sub: `${connectedRate}%`, icon: PhoneCall, color: "emerald", bgColor: "bg-emerald-50", iconColor: "text-emerald-500", status: "connected" },
          { label: "Total Prospects", value: totalProspects, sub: "Overall", icon: Users, color: "purple", bgColor: "bg-purple-50", iconColor: "text-purple-500", status: "all" },
          { label: "Pending Follow-ups", value: stats?.personalStats?.pendingFollowups || 0, sub: "Action Items", icon: Clock, color: "orange", bgColor: "bg-orange-50", iconColor: "text-orange-400", status: "all" },
          { label: "DNC", value: dncCount, sub: `${dncRate}%`, icon: Ban, color: "red", bgColor: "bg-red-50", iconColor: "text-red-500", status: "dnc" },
          { label: "Qualified", value: qualifiedCount, sub: `${qualifiedRate}%`, icon: CheckCircle2, color: "green", bgColor: "bg-green-50", iconColor: "text-green-500", status: "qualified" },
        ].map((item, i) => (
          <Card 
            key={i} 
            className="border-none shadow-sm rounded-2xl bg-white cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => setFilterStatus(item.status)}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", item.bgColor, item.iconColor)}>
                  <item.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-slate-800">{item.value}</p>
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                <p className={cn("text-xs font-bold mt-1", i === 1 || i === 5 ? "text-emerald-500" : "text-slate-400")}>
                  {item.sub}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Prospects */}
        <div className="lg:col-span-7">
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white h-full">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-bold text-slate-800">Recent Prospects</CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-1">Latest prospects worked on by telecallers</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="pl-8 font-bold text-slate-500 text-[11px] uppercase tracking-widest py-5">#</TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-widest">Student Name</TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-widest">Telecaller</TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-widest">Status</TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-widest">Purpose & Notes</TableHead>
                    <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-widest">Last Action</TableHead>
                    <TableHead className="pr-8 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProspects.slice(0, 5).map((p, index) => (
                    <TableRow key={p.id} className="border-slate-100 group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-8 py-4.5 text-sm font-medium text-slate-400">{index + 1}</TableCell>
                      <TableCell className="font-bold text-sm text-slate-700">{p.name}</TableCell>
                      <TableCell className="text-sm font-bold text-slate-500">
                        {stats?.teamPerformance?.find((tc: any) => tc.id === p.assignedTo)?.name?.split(' ')[0] || "pp"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-[10px] font-bold px-2.5 py-1 rounded-lg border-none shadow-sm capitalize",
                            p.status === 'New' && "bg-blue-50 text-blue-500",
                            p.status === 'dnc' && "bg-red-50 text-red-500",
                            p.status === 'qualified' && "bg-emerald-50 text-emerald-500",
                            p.status === 'interested' && "bg-green-50 text-green-500",
                          )}
                        >
                          {p.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">{p.purposeOfCall || "-"}</span>
                          {p.lastCallNotes && (
                            <p className="text-[10px] text-slate-500 italic font-medium leading-relaxed break-words whitespace-normal mt-1">
                              {p.lastCallNotes}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">
                        {p.lastCallAt ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-700">{new Date(p.lastCallAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{new Date(p.lastCallAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-8 px-4 rounded-lg text-[10px] font-extrabold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200"
                          onClick={() => handleViewDetails(p)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-6 border-t border-slate-100">
                <Link href="/spoc/leads">
                  <Button variant="link" className="text-blue-500 font-bold text-sm p-0 flex items-center gap-1.5 hover:no-underline hover:text-blue-600">
                    View all prospects <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call Outcome Distribution */}
        <div className="lg:col-span-5">
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white h-full">
            <CardHeader className="p-8 pb-2">
              <CardTitle className="text-2xl font-bold text-slate-800">Call Outcome Distribution</CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-1">Overview of overall call outcomes</CardDescription>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center">
              <div className="flex flex-row items-center w-full gap-8">
                {/* Graph */}
                <div className="h-[260px] w-1/2 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={5}
                        cornerRadius={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="text-4xl font-extrabold tracking-tight text-slate-800">{totalCalls}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Calls</p>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-5 w-1/2">
                  {chartData.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[13px] font-bold text-slate-500">{item.name}</span>
                      </div>
                      <span className="text-[13px] font-bold text-slate-400">
                        {item.value} ({totalCalls > 0 ? Math.round((item.value / totalCalls) * 100) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full mt-12">
                <Link href="/spoc/reports">
                  <Button variant="link" className="text-blue-500 font-bold text-sm p-0 flex items-center gap-1.5 hover:no-underline hover:text-blue-600">
                    View detailed report <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Prospect Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          {selectedProspect && (
            <div className="bg-white text-slate-900">
              <div className="p-8 bg-slate-900 text-white">
                <DialogHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl font-black">
                      {selectedProspect.name.charAt(0)}
                    </div>
                    <div>
                      <DialogTitle className="text-3xl font-black text-white leading-none mb-2 text-left">
                        {selectedProspect.name}
                      </DialogTitle>
                      <Badge className="bg-emerald-500 text-white border-none rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider">
                        {selectedProspect.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <ScrollArea className="max-h-[65vh]">
                <div className="px-10 py-8 space-y-10">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-10 text-left">
                    <div className="space-y-2">
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Mobile Number</p>
                      <div className="flex items-center gap-3 text-slate-800 font-bold text-lg">
                        <Phone className="h-5 w-5 text-blue-500" />
                        {selectedProspect.mobile}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Email Address</p>
                      <div className="flex items-center gap-3 text-slate-800 font-bold text-lg">
                        <Mail className="h-5 w-5 text-purple-500" />
                        {selectedProspect.email || "N/A"}
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-100/80" />

                  {/* Academic Info */}
                  <div className="grid grid-cols-2 gap-10 text-left">
                    <div className="space-y-2">
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">School/College</p>
                      <div className="flex items-center gap-3 text-slate-800 font-bold text-lg">
                        <SchoolIcon className="h-5 w-5 text-emerald-500" />
                        {selectedProspect.schoolLastAttended || "N/A"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Location</p>
                      <div className="flex items-center gap-3 text-slate-800 font-bold text-lg">
                        <MapPin className="h-5 w-5 text-orange-500" />
                        {selectedProspect.location}
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-100/80" />

                  {/* Course Info */}
                  <div className="space-y-4 text-left">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Course Interest</p>
                    <div className="bg-blue-50/50 rounded-[24px] p-6 flex items-center justify-between border border-blue-100/50">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-blue-500" />
                        </div>
                        <span className="text-xl font-black text-slate-900">{selectedProspect.courseInterest}</span>
                      </div>
                      <Badge className="bg-blue-500 text-white border-none font-bold rounded-full px-4 py-1 shadow-md shadow-blue-200">
                        Primary
                      </Badge>
                    </div>
                  </div>

                  {/* History */}
                  <div className="space-y-4 text-left pb-4">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Activity History</p>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center gap-4 p-5 rounded-[24px] bg-slate-50 border border-slate-100">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <ClockIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Last Call Made</p>
                          <p className="text-xs text-slate-500 font-medium">
                            {selectedProspect.lastCallAt ? new Date(selectedProspect.lastCallAt).toLocaleString() : "No calls yet"}
                          </p>
                          {selectedProspect.purposeOfCall && (
                            <p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-1">
                              {selectedProspect.purposeOfCall}
                            </p>
                          )}
                          {selectedProspect.lastCallNotes && (
                            <p className="text-xs text-slate-600 italic font-medium leading-relaxed mt-1 break-words">
                              {selectedProspect.lastCallNotes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-5 rounded-[24px] bg-slate-50 border border-slate-100">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <CalendarIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Registration Date</p>
                          <p className="text-sm text-slate-500 font-medium">
                            {new Date(selectedProspect.createdAt).toLocaleDateString(undefined, { dateStyle: 'full' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-8 bg-white border-t border-slate-100 flex justify-center">
                <Button 
                  onClick={() => setIsDetailOpen(false)} 
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-[20px] px-12 h-14 text-lg shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95"
                >
                  Close Profile
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
