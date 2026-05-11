"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Users,
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  Eye,
  UserCog,
  Archive,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Mail,
  User,
  CheckCircle2,
  Clock,
  History,
  FileText,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { purposeOptions } from "@/components/call-outcome-modal"

const statusColors: Record<string, string> = {
  New: "bg-[#a2d2df] text-[#1e3a45] border-[#8cb7c4]",
  Contacted: "bg-[#bcd2ee] text-[#2a3e59] border-[#a4bad6]",
  Warm: "bg-[#fdfd96] text-[#5e5e2e] border-[#e4e487]",
  Hot: "bg-[#ffccb6] text-[#593d31] border-[#e6b8a4]",
  VisitScheduled: "bg-[#e0bbe4] text-[#4d3d4f] border-[#caa8cd]",
  VisitDone: "bg-[#e0bbe4] text-[#4d3d4f] border-[#caa8cd]",
  AdmissionDone: "bg-[#b2f2bb] text-[#2d4531] border-[#a0dab0] rounded-full",
  "Cold-NoResponse": "bg-[#666666] text-white border-[#555555]",
  "Cold-NotInterested": "bg-[#666666] text-white border-[#555555]",
  Lost: "bg-[#ffb3ba] text-[#5e3b3d] border-[#e6a1a7]",
}

function getStage(status: string): string {
  const s = status ? status.toLowerCase() : ""
  if (["qualified", "visit scheduled", "visit done", "admission done", "hot"].includes(s)) return "Hot"
  if (["callback", "callback scheduled", "interested", "warm", "contacted"].includes(s)) return "Warm"
  if (["lost", "enrolledelsewhere"].includes(s)) return "Lost"
  return "Cold"
}

const stageColors: Record<string, string> = {
  "Hot": "bg-red-100 text-red-700 border-red-200 font-bold",
  "Warm": "bg-orange-100 text-orange-700 border-orange-200 font-bold",
  "Cold": "bg-blue-100 text-blue-700 border-blue-200 font-bold",
  "Lost": "bg-gray-100 text-gray-700 border-gray-200 font-bold",
}

const ITEMS_PER_PAGE = 15

export default function AdminProspectsPage() {
  const [prospects, setProspects] = useState<any[]>([])
  const [telecallers, setTelecallers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [assignedFilter, setAssignedFilter] = useState<string>("all")
  const [courseFilter, setCourseFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProspect, setSelectedProspect] = useState<any | null>(null)
  const [selectedProspectLogs, setSelectedProspectLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Add Prospect State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newProspect, setNewProspect] = useState({
    name: "",
    mobile: "",
    email: "",
    location: "",
    courseInterest: "BCA",
    status: "New",
    purposeOfCall: ""
  })

  const loadData = useCallback(async () => {
    try {
      const [pData, tData] = await Promise.all([
        api.getProspects(),
        api.getTelecallers()
      ])
      setProspects(pData)
      setTelecallers(tData)
    } catch (err) {
      console.error("Failed to load prospects:", err)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddProspect = async () => {
    if (!newProspect.name || !newProspect.mobile) {
      toast.error("Name and Mobile are required")
      return
    }
    try {
      await api.createProspect(newProspect)
      toast.success("Prospect added successfully")
      setIsAddDialogOpen(false)
      setNewProspect({
        name: "",
        mobile: "",
        email: "",
        location: "",
        courseInterest: "BCA",
        status: "New",
        purposeOfCall: ""
      })
      loadData()
    } catch (err) {
      toast.error("Failed to add prospect")
    }
  }

  // Filter prospects
  const filteredProspects = useMemo(() => {
    return prospects.filter((prospect) => {
      const matchesSearch =
        prospect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prospect.mobile.includes(searchQuery) ||
        (prospect.location || "").toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || prospect.status === statusFilter
      const matchesAssigned =
        assignedFilter === "all" ||
        (assignedFilter === "unassigned" && !prospect.assignedTo) ||
        prospect.assignedTo === assignedFilter
      const matchesCourse =
        courseFilter === "all" || prospect.courseInterest === courseFilter
      return matchesSearch && matchesStatus && matchesAssigned && matchesCourse
    })
  }, [prospects, searchQuery, statusFilter, assignedFilter, courseFilter])

  // Pagination
  const totalPages = Math.ceil(filteredProspects.length / ITEMS_PER_PAGE) || 1
  const paginatedProspects = filteredProspects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleViewDetails = async (prospect: any) => {
    setSelectedProspect(prospect)
    setIsDetailOpen(true)
    setLoadingLogs(true)
    try {
      const logs = await api.getProspectCallLogs(prospect.id)
      setSelectedProspectLogs(logs)
    } catch (err) {
      console.error(err)
      setSelectedProspectLogs([])
    } finally {
      setLoadingLogs(false)
    }
  }

  const getAssignedTelecaller = (id?: string) => {
    if (!id) return null
    return telecallers.find((tc) => tc.id === id)
  }

  // Stats — case-insensitive to handle different status casing in DB
  const stats = {
    total: prospects.length,
    assigned: prospects.filter((p) => p.assignedTo).length,
    qualified: prospects.filter((p) => (p.status || "").toLowerCase() === "qualified").length,
    pending: prospects.filter((p) => !p.assignedTo).length,
  }

  if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading Prospect Bank...</div>

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prospect Management</h1>
          <p className="text-muted-foreground text-sm">
            View and manage all prospects in the database
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900">{stats.total}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Prospects</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="h-1 bg-blue-500" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900">{stats.assigned}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-3">
                <UserCog className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <div className="h-1 bg-purple-500" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-emerald-600">{stats.qualified}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qualified</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            <div className="h-1 bg-emerald-500" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-yellow-600">{stats.pending}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</p>
              </div>
              <div className="rounded-xl bg-yellow-50 p-3">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
            <div className="h-1 bg-yellow-500" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm bg-white p-2 rounded-2xl">
        <CardContent className="p-2">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, mobile, or location..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-11 h-12 rounded-xl border-none bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all shadow-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-40 h-12 rounded-xl border-none bg-slate-50/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Warm">Warm</SelectItem>
                  <SelectItem value="Hot">Hot</SelectItem>
                  <SelectItem value="VisitScheduled">Visit Scheduled</SelectItem>
                  <SelectItem value="VisitDone">Visit Done</SelectItem>
                  <SelectItem value="AdmissionDone">Admission Done</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={assignedFilter}
                onValueChange={(v) => {
                  setAssignedFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-44 h-12 rounded-xl border-none bg-slate-50/50">
                  <SelectValue placeholder="Assigned To" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="all">All Telecallers</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {telecallers.map((tc) => (
                    <SelectItem key={tc.id} value={tc.id}>
                      {tc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={courseFilter}
                onValueChange={(v) => {
                  setCourseFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-40 h-12 rounded-xl border-none bg-slate-50/50">
                  <SelectValue placeholder="Course" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="MBA">MBA</SelectItem>
                  <SelectItem value="BCA">BCA</SelectItem>
                  <SelectItem value="CA21">CA21 Cell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prospects Table */}
      <Card className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                  <TableHead className="w-16 pl-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">ID</TableHead>
                  <TableHead className="py-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">Name</TableHead>
                  <TableHead className="py-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">Mobile</TableHead>
                  <TableHead className="py-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">Location</TableHead>
                  <TableHead className="py-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">Course</TableHead>
                  <TableHead className="py-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">Assigned To</TableHead>
                  <TableHead className="py-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">Status</TableHead>
                  <TableHead className="py-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">Stage</TableHead>
                  <TableHead className="py-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">Purpose</TableHead>
                  <TableHead className="w-20 pr-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProspects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-300">
                        <Users className="h-12 w-12 opacity-20" />
                        <p className="font-bold">No prospects found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProspects.map((prospect, index) => {
                    const assignedTc = getAssignedTelecaller(prospect.assignedTo)
                    return (
                      <TableRow key={prospect.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                        <TableCell className="pl-8 py-4 font-mono text-[10px] text-slate-400">
                          {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </TableCell>
                        <TableCell className="font-bold text-slate-800">{prospect.name}</TableCell>
                        <TableCell className="font-bold text-slate-600">
                          {prospect.mobile}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-slate-500">{prospect.location || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg px-2 py-0.5">
                            {prospect.courseInterest || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {assignedTc ? (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                {assignedTc.name.charAt(0)}
                              </div>
                              <span className="text-sm font-bold text-slate-700">{assignedTc.name}</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-bold border-0 bg-slate-100 text-slate-400 px-3 py-1 rounded-full uppercase tracking-tighter">
                              Common Pool
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(statusColors[prospect.status] || "bg-slate-100", "text-[10px] font-bold border-0 px-3 py-1 rounded-full")}
                          >
                            {prospect.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(stageColors[getStage(prospect.status)], "text-[10px] font-bold border-0 px-3 py-1 rounded-full")}
                          >
                            {getStage(prospect.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[250px] align-top">
                          <div className="flex flex-col gap-1.5 py-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">
                                {prospect.purposeOfCall || "No Purpose"}
                              </span>
                            </div>
                            {prospect.lastCallNotes && (
                              <p className="text-[11px] text-slate-500 italic font-medium leading-relaxed break-words whitespace-normal">
                                {prospect.lastCallNotes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100">
                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl">
                              <DropdownMenuItem onClick={() => handleViewDetails(prospect)} className="rounded-lg">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-8 py-6 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredProspects.length)} of{" "}
              {filteredProspects.length} prospects
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-10 w-10 rounded-xl border-slate-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-black text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-10 w-10 rounded-xl border-slate-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Prospect Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <div className="bg-slate-900 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-400" />
                </div>
                Add Prospect
              </DialogTitle>
              <p className="text-slate-400 font-medium mt-2">
                Manually add a new prospect to the database.
              </p>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Student Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="e.g. John Doe"
                  value={newProspect.name}
                  onChange={(e) => setNewProspect({ ...newProspect, name: e.target.value })}
                  className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="e.g. 9876543210"
                  value={newProspect.mobile}
                  onChange={(e) => setNewProspect({ ...newProspect, mobile: e.target.value })}
                  className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Location (Optional)</Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="e.g. Chennai"
                  value={newProspect.location}
                  onChange={(e) => setNewProspect({ ...newProspect, location: e.target.value })}
                  className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Course</Label>
                <Select value={newProspect.courseInterest} onValueChange={(v) => setNewProspect({ ...newProspect, courseInterest: v })}>
                  <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium">
                    <SelectValue placeholder="Course" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="MBA">MBA</SelectItem>
                    <SelectItem value="BCA">BCA</SelectItem>
                    <SelectItem value="CA21">CA21 Cell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Initial Status</Label>
                <Select value={newProspect.status} onValueChange={(v) => setNewProspect({ ...newProspect, status: v })}>
                  <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Warm">Warm</SelectItem>
                    <SelectItem value="Hot">Hot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Purpose of Call</Label>
              <Select value={newProspect.purposeOfCall} onValueChange={(v) => setNewProspect({ ...newProspect, purposeOfCall: v })}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium">
                  <SelectValue placeholder="Select Purpose" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {purposeOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-8 bg-slate-50 flex gap-3 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              className="flex-1 h-14 rounded-2xl font-bold border-slate-200 hover:bg-white text-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddProspect}
              disabled={!newProspect.name || !newProspect.mobile}
              className="flex-[2] h-14 rounded-2xl font-black bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200 transition-all hover:scale-[1.02] active:scale-95"
            >
              Add to Database
              <Plus className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prospect Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <div className="bg-slate-900 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                Prospect Details
              </DialogTitle>
              <p className="text-slate-400 font-medium mt-2">
                Detailed profile and activity for this prospect.
              </p>
            </DialogHeader>
          </div>

          {selectedProspect && (
            <ScrollArea className="max-h-[calc(90vh-160px)] p-8">
              <div className="space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Full Name</Label>
                      <p className="text-lg font-black text-slate-900">{selectedProspect.name}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Phone Number</Label>
                      <p className="text-base font-bold text-slate-700">{selectedProspect.mobile}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Location</Label>
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        {selectedProspect.location || "Not provided"}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Current Status</Label>
                      <div>
                        <Badge className={cn(statusColors[selectedProspect.status], "border-0 px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider")}>
                          {selectedProspect.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Course Interest</Label>
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <Building2 className="h-4 w-4 text-purple-500" />
                        {selectedProspect.courseInterest}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Lead Source</Label>
                      <p className="text-sm font-bold text-slate-500 bg-slate-100 w-fit px-3 py-1 rounded-lg">{selectedProspect.source || "Manual Entry"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Phone className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Last Call Summary</Label>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Purpose</p>
                      <p className="text-base font-black text-slate-900">{selectedProspect.purposeOfCall || "No purpose defined"}</p>
                    </div>
                    {selectedProspect.lastCallNotes && (
                      <div className="pt-2 border-t border-blue-100">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Full Description</p>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed italic">{selectedProspect.lastCallNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Assignment Info */}
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Assignment Status</h3>
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                      <UserCog className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Assigned To</span>
                      <div className="mt-2">
                        {getAssignedTelecaller(selectedProspect.assignedTo) ? (
                          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center font-black text-blue-600">
                              {getAssignedTelecaller(selectedProspect.assignedTo)?.name.charAt(0)}
                            </div>
                            <p className="font-bold text-slate-700">{getAssignedTelecaller(selectedProspect.assignedTo)?.name}</p>
                          </div>
                        ) : (
                          <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200">
                            <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Common Pool</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Timeline</span>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Created</span>
                          <span className="font-bold text-slate-700">{new Date(selectedProspect.createdAt).toLocaleDateString()}</span>
                        </div>
                        {selectedProspect.assigned_at && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Assigned</span>
                            <span className="font-bold text-slate-700">{new Date(selectedProspect.assigned_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call History */}
                <div className="space-y-4">
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                    <History className="h-4 w-4 text-slate-400" />
                    Interaction History
                  </h3>

                  {/* Current Call Status Summary */}
                  {(selectedProspect.purposeOfCall || selectedProspect.lastCallNotes) && (
                    <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center">
                          <FileText className="h-3.5 w-3.5 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Current Call Status</span>
                      </div>
                      <div className="space-y-3">
                        {selectedProspect.purposeOfCall && (
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Purpose</Label>
                            <p className="text-sm font-black text-white">{selectedProspect.purposeOfCall}</p>
                          </div>
                        )}
                        {selectedProspect.lastCallNotes && (
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Full Description</Label>
                            <p className="text-xs text-slate-300 italic leading-relaxed break-words">{selectedProspect.lastCallNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {loadingLogs ? (
                    <div className="p-8 text-center text-sm font-bold text-slate-400 animate-pulse">Loading interaction history...</div>
                  ) : selectedProspectLogs.length === 0 ? (
                    <div className="p-8 rounded-[32px] border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                        <Phone className="h-5 w-5 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-400">No interaction logs available for this lead</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedProspectLogs.map((log) => (
                        <div key={log.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="mt-1">
                              <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{log.notes || "No notes provided"}</p>
                              <p className="text-xs font-bold text-slate-400 mt-1">
                                {new Date(log.calledAt).toLocaleString("en-IN", {
                                  dateStyle: "medium",
                                  timeStyle: "short"
                                })}
                              </p>
                            </div>
                          </div>
                          <div>
                            <Badge className={cn(statusColors[log.outcome], "border-0 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider")}>
                              {log.outcome}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
