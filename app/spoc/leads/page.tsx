"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import {
  Users,
  Search,
  Filter,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  BookOpen,
  Plus,
  Upload,
  X,
  ChevronRight,
  MoreHorizontal,
  ArrowRight,
  ClipboardCheck,
  Building2,
  Calendar,
  Building,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { purposeOptions } from "@/components/call-outcome-modal"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api"
import { type Prospect } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function LeadBank() {
  const [leads, setLeads] = useState<Prospect[]>([])
  const [telecallers, setTelecallers] = useState<any[]>([])
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [targetTelecaller, setTargetTelecaller] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [telecallerFilter, setTelecallerFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  
  // Add Lead Sheet State
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [newLead, setNewLead] = useState({
    name: "",
    mobile: "",
    location: "",
    courseInterest: "",
    status: "New",
    assignedTo: "",
    notes: "",
    purposeOfCall: ""
  })
  
  // New Task State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [taskInstitution, setTaskInstitution] = useState("")
  const [taskAction, setTaskAction] = useState("")
  const [taskTelecaller, setTaskTelecaller] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    try {
      const [prospectsData, tcData] = await Promise.all([
        api.getProspects(),
        api.getTelecallers()
      ])
      setLeads(prospectsData)
      setTelecallers(tcData)
    } catch (err) {
      console.error("Failed to load leads data:", err)
      toast.error("Failed to load leads")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleCreateTask = async () => {
    if (!taskInstitution || !taskAction || !taskTelecaller) return
    try {
      const isCommon = taskTelecaller === "all" || taskTelecaller === "common";
      
      await api.createFollowUp({
        assignedToRole: 'Telecaller',
        assignedToUser: isCommon ? null : taskTelecaller,
        institutionName: taskInstitution,
        actionDescription: taskAction,
        followUpDate: new Date().toISOString().split('T')[0],
      })
      
      toast.success(isCommon ? "Task assigned to Common Pool!" : "Follow-up task assigned successfully!")
      
      setIsCreateDialogOpen(false)
      setTaskInstitution("")
      setTaskAction("")
      setTaskTelecaller("")
    } catch (err) {
      console.error("Failed to create task:", err)
      toast.error("Failed to assign task")
    }
  }

  const filteredLeads = useMemo(() => {
    return leads.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.mobile.includes(searchQuery)
      const matchesStatus = statusFilter === "all" || p.status === statusFilter
      const matchesTelecaller = telecallerFilter === "all" || 
                               (telecallerFilter === "common" && p.assignedTo === null) || 
                               (p.assignedTo === telecallerFilter)
      return matchesSearch && matchesStatus && matchesTelecaller
    })
  }, [leads, searchQuery, statusFilter, telecallerFilter])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map(p => p.id))
    } else {
      setSelectedLeads([])
    }
  }

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId])
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId))
    }
  }

  const handleAssign = async () => {
    if (!targetTelecaller || selectedLeads.length === 0) return

    try {
      await api.assignLeads({
        leadIds: selectedLeads,
        telecallerId: targetTelecaller
      })
      toast.success(`Successfully assigned ${selectedLeads.length} leads!`)
      setSelectedLeads([])
      loadData()
    } catch (err) {
      console.error("Assignment failed:", err)
      toast.error("Failed to assign leads")
    }
  }

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.mobile) {
      toast.error("Please fill in Name and Phone")
      return
    }

    try {
      await api.createProspect(newLead)
      toast.success("Lead added successfully!")
      setIsAddSheetOpen(false)
      setNewLead({
        name: "",
        mobile: "",
        location: "",
        courseInterest: "",
        status: "New",
        assignedTo: "",
        notes: "",
        purposeOfCall: ""
      })
      loadData()
    } catch (err) {
      toast.error("Failed to add lead")
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n')
      
      const prospects = lines.slice(1).map(line => {
        const values = line.split(',')
        if (values.length < 2) return null
        return {
          name: values[0]?.trim(),
          mobile: values[1]?.trim(),
          location: values[2]?.trim(),
          courseInterest: values[3]?.trim(),
          status: "New",
          source: "CSV Import"
        }
      }).filter(Boolean)

      if (prospects.length === 0) {
        toast.error("No valid prospects found in CSV")
        return
      }

      try {
        await api.bulkImportProspects(prospects)
        toast.success(`Successfully imported ${prospects.length} leads!`)
        loadData()
      } catch (err) {
        toast.error("Failed to import leads")
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Initializing Lead Bank...</div>

  return (
    <div className="p-8 lg:p-12 space-y-10 relative max-w-[1600px] mx-auto">
      {/* Floating Action Bar */}
      <div className="absolute top-12 right-12 z-20 flex items-center bg-black/95 backdrop-blur-md text-white px-2 py-1.5 rounded-full shadow-2xl border border-white/10">
        <button 
          className="text-white hover:text-white/80 font-semibold text-[13px] px-6 py-2 transition-all flex items-center"
          onClick={() => setIsAddSheetOpen(true)}
        >
          [ + Add Lead ]
        </button>
        <div className="w-[1px] h-5 bg-white/10" />
        <button 
          className="text-blue-400 hover:text-blue-300 font-semibold text-[13px] px-6 py-2 transition-all flex items-center"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          [ <ClipboardCheck className="mr-2 h-4 w-4 inline-block" /> Assign Task ]
        </button>
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Lead Bank</h1>
        <p className="text-muted-foreground text-lg">Pool of all prospects and assignment control</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3 space-y-8">
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-muted/40 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">Assignment Control</CardTitle>
              <CardDescription>Select leads to distribute</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="p-5 bg-background rounded-2xl border border-border shadow-sm flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-none">{selectedLeads.length} leads selected</p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Choose from the table to enable assignment.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2.5">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Assign To
                  </Label>
                  <Select value={targetTelecaller} onValueChange={setTargetTelecaller}>
                    <SelectTrigger className="h-12 rounded-xl bg-background border-border hover:border-primary/50 transition-all">
                      <SelectValue placeholder="Select Telecaller" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="common" className="font-bold text-primary italic">
                        [ COMMON POOL ]
                      </SelectItem>
                      <Separator className="my-2" />
                      {telecallers.map(tc => (
                        <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full h-12 rounded-xl bg-black text-white hover:bg-black/90 shadow-lg font-bold text-sm transition-all" 
                  disabled={!targetTelecaller || selectedLeads.length === 0}
                  onClick={handleAssign}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Confirm Assignment
                </Button>
              </div>

              <Separator />

              <div className="space-y-2.5">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Quick Filter
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 rounded-xl bg-background border-border">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Warm">Warm</SelectItem>
                    <SelectItem value="Hot">Hot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Filter By Telecaller
                </Label>
                <Select value={telecallerFilter} onValueChange={setTelecallerFilter}>
                  <SelectTrigger className="h-11 rounded-xl bg-background border-border">
                    <SelectValue placeholder="All Telecallers" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Telecallers</SelectItem>
                    <SelectItem value="common" className="font-bold text-primary italic">[ COMMON POOL ]</SelectItem>
                    <Separator className="my-1" />
                    {telecallers.map(tc => (
                      <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-9 space-y-6">
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-background rounded-3xl overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or mobile..."
                  className="pl-11 h-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="pl-8 py-5 w-[60px]">
                        <Checkbox 
                          className="rounded-md"
                          checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                          onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        />
                      </TableHead>
                      <TableHead className="font-bold text-foreground">Student Details</TableHead>
                      <TableHead className="font-bold text-foreground">Location & Course</TableHead>
                      <TableHead className="font-bold text-foreground">Purpose of Call</TableHead>
                      <TableHead className="font-bold text-foreground">Assigned To</TableHead>
                      <TableHead className="font-bold text-foreground">Time Info</TableHead>
                      <TableHead className="font-bold text-foreground text-right pr-8">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className="group hover:bg-muted/10 transition-colors border-border/50">
                        <TableCell className="pl-8 py-6">
                          <Checkbox 
                            className="rounded-md"
                            checked={selectedLeads.includes(lead.id)}
                            onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-foreground group-hover:text-primary transition-colors">{lead.name}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" /> {lead.mobile}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {lead.location}
                            </div>
                            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                              <BookOpen className="h-3.5 w-3.5 shrink-0" />
                              {lead.courseInterest}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <Select 
                              value={lead.purposeOfCall || ""} 
                              onValueChange={async (v) => {
                                try {
                                  setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, purposeOfCall: v } : l));
                                  await api.updateProspect(lead.id, { purposeOfCall: v });
                                } catch (err) {
                                  toast.error("Failed to update purpose");
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-[11px] bg-muted/50 border-none focus:ring-1 w-[140px] rounded-lg">
                                <SelectValue placeholder="Set purpose..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-none shadow-2xl">
                                {purposeOptions.map(opt => (
                                  <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {lead.lastCallNotes && (
                              <p className="text-[11px] text-muted-foreground italic font-medium leading-relaxed break-words whitespace-normal mt-1">
                                {lead.lastCallNotes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                {telecallers.find(t => t.id === lead.assignedTo)?.name?.charAt(0) || 'T'}
                              </div>
                              <span className="text-sm font-medium text-slate-700">
                                {telecallers.find(t => t.id === lead.assignedTo)?.name || 'Assigned'}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-muted text-muted-foreground border-dashed text-[10px] font-medium">
                              Common Pool
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Plus className="h-3 w-3 text-emerald-500" />
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </div>
                            {lead.assignedAt && (
                              <div className="flex items-center gap-1.5 font-medium text-slate-400">
                                <UserPlus className="h-3 w-3 text-blue-500" />
                                {new Date(lead.assignedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Badge 
                            variant="secondary"
                            className={cn(
                              "text-[11px] font-bold px-3 py-1 rounded-lg border-none min-w-[80px] justify-center",
                              lead.status === "New" && !lead.lastCallAt && "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200",
                              lead.status === "New" && lead.lastCallAt && "bg-blue-50 text-blue-600",
                              lead.status === "Warm" && "bg-orange-50 text-orange-600",
                              lead.status === "Hot" && "bg-red-50 text-red-600",
                              lead.status === "Contacted" && "bg-green-50 text-green-600",
                              lead.status === "qualified" && "bg-emerald-100 text-emerald-700",
                              lead.status === "dnc" && "bg-slate-100 text-slate-600",
                              lead.status === "visit_scheduled" && "bg-purple-100 text-purple-700"
                            )}
                          >
                            {lead.status === "New" && !lead.lastCallAt ? "New (Untouched)" : lead.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <SheetContent className="sm:max-w-md p-0 gap-0 border-none shadow-2xl rounded-l-3xl overflow-hidden flex flex-col h-[100vh]">
          <div className="flex flex-col h-full bg-background relative">
            <SheetHeader className="px-8 pt-10 pb-6 bg-muted/30 shrink-0">
              <SheetTitle className="text-3xl font-extrabold tracking-tight">Add New Lead</SheetTitle>
              <SheetDescription>Enter prospect details for the bank</SheetDescription>
            </SheetHeader>
            
            <ScrollArea className="flex-1 px-8 mb-24">
              <div className="space-y-10 py-10">
                <div className="space-y-4">
                  <Label htmlFor="name" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Student Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Anjali R." 
                    className="h-12 rounded-xl bg-muted/20 border-none focus-visible:ring-1"
                    value={newLead.name}
                    onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="mobile" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                  <Input 
                    id="mobile" 
                    placeholder="+91 XXXXXXXXXX" 
                    className="h-12 rounded-xl bg-muted/20 border-none focus-visible:ring-1"
                    value={newLead.mobile}
                    onChange={(e) => setNewLead({...newLead, mobile: e.target.value})}
                  />
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="location" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Location</Label>
                  <Input 
                    id="location" 
                    placeholder="e.g. Chennai" 
                    className="h-12 rounded-xl bg-muted/20 border-none focus-visible:ring-1"
                    value={newLead.location}
                    onChange={(e) => setNewLead({...newLead, location: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Course</Label>
                    <Select value={newLead.courseInterest} onValueChange={(v) => setNewLead({...newLead, courseInterest: v})}>
                      <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="MBA">MBA</SelectItem>
                        <SelectItem value="BCA">BCA</SelectItem>
                        <SelectItem value="CA21">CA21 Cell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Initial Status</Label>
                    <Select value={newLead.status} onValueChange={(v) => setNewLead({...newLead, status: v})}>
                      <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Warm">Warm</SelectItem>
                        <SelectItem value="Hot">Hot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="assign" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Assign To (Optional)</Label>
                  <Select value={newLead.assignedTo} onValueChange={(v) => setNewLead({...newLead, assignedTo: v})}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none">
                      <SelectValue placeholder="Select Telecaller" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="common" className="font-bold text-primary italic">
                        [ COMMON POOL ]
                      </SelectItem>
                      <Separator className="my-2" />
                      {telecallers.map(tc => (
                        <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="notes" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Initial Notes</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Any specific details..." 
                    className="rounded-2xl bg-muted/20 border-none focus-visible:ring-1"
                    value={newLead.notes}
                    onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                    rows={4}
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="purpose" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Purpose of Call</Label>
                  <Select value={newLead.purposeOfCall} onValueChange={(v) => setNewLead({...newLead, purposeOfCall: v})}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none focus:ring-1">
                      <SelectValue placeholder="Select Purpose" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {purposeOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ScrollArea>
            
            <div className="absolute bottom-0 left-0 right-0 px-8 py-8 border-t bg-background z-30">
              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setIsAddSheetOpen(false)} className="flex-1 h-12 rounded-xl font-bold hover:bg-destructive/10 hover:text-destructive transition-all">
                  Cancel
                </Button>
                <Button className="flex-1 h-12 rounded-xl bg-black text-white hover:bg-black/90 shadow-xl font-bold transition-all" onClick={handleAddLead}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Confirm & Add Lead
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <div className="bg-slate-900 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-blue-400" />
                </div>
                Assign Task
              </DialogTitle>
              <p className="text-slate-400 font-medium mt-2">
                Create a follow-up task for a telecaller.
              </p>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Institution Name</Label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="e.g. Brilliant Coaching Centre"
                  value={taskInstitution}
                  onChange={(e) => setTaskInstitution(e.target.value)}
                  className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Assign to Telecaller</Label>
              <Select value={taskTelecaller} onValueChange={setTaskTelecaller}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium">
                  <SelectValue placeholder="Select a telecaller" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="common" className="rounded-xl my-1 font-black text-blue-600 italic uppercase tracking-wider">
                    [ COMMON POOL ]
                  </SelectItem>
                  <Separator className="my-1 opacity-50" />
                  {telecallers.map(t => (
                    <SelectItem key={t.id} value={t.id} className="rounded-xl my-1">{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Action Description</Label>
              <Textarea 
                placeholder="What exactly needs to be done?"
                value={taskAction}
                onChange={(e) => setTaskAction(e.target.value)}
                className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all resize-none p-4 font-medium"
              />
            </div>
          </div>

          <div className="p-8 bg-slate-50 flex gap-3 border-t border-slate-100">
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              className="flex-1 h-14 rounded-2xl font-bold border-slate-200 hover:bg-white text-slate-600"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTask}
              disabled={!taskInstitution || !taskAction || !taskTelecaller}
              className="flex-[2] h-14 rounded-2xl font-black bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200 transition-all hover:scale-[1.02] active:scale-95"
            >
              Assign Task
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
