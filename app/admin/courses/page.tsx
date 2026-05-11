"use client"

import { useState, useEffect, useCallback } from "react"
import {
  BookOpen,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  GraduationCap,
  Clock,
  CircleDollarSign,
  Building2,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { toast } from "sonner"

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    department: "",
    duration: "",
    fees: ""
  })

  const loadCourses = useCallback(async () => {
    try {
      const data = await api.getCourses()
      setCourses(data)
    } catch (err) {
      console.error("Failed to load courses:", err)
      toast.error("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  const handleOpenAdd = () => {
    setEditingCourse(null)
    setFormData({
      name: "",
      code: "",
      department: "",
      duration: "",
      fees: ""
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (course: any) => {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      code: course.code,
      department: course.department,
      duration: course.duration,
      fees: course.fees
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast.error("Name and Code are required")
      return
    }
    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, formData)
        toast.success("Course updated successfully")
      } else {
        await api.createCourse(formData)
        toast.success("Course added successfully")
      }
      setIsDialogOpen(false)
      loadCourses()
    } catch (err) {
      toast.error("Operation failed")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return
    try {
      await api.deleteCourse(id)
      toast.success("Course deleted")
      loadCourses()
    } catch (err) {
      toast.error("Failed to delete")
    }
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading Academic Catalog...</div>

  return (
    <div className="p-8 space-y-10 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Academic Courses</h1>
          <p className="text-slate-500 font-medium">Manage the catalog of available programs and courses</p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="bg-black hover:bg-black/90 text-white font-bold rounded-xl h-12 px-6 shadow-lg transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden group">
          <CardContent className="p-0">
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-slate-900">{courses.length}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Programs</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4 transition-colors group-hover:bg-blue-100">
                <BookOpen className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="h-1.5 bg-blue-500" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden group">
          <CardContent className="p-0">
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-slate-900">
                  {new Set(courses.map(c => c.department)).size}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Departments</p>
              </div>
              <div className="rounded-2xl bg-purple-50 p-4 transition-colors group-hover:bg-purple-100">
                <GraduationCap className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="h-1.5 bg-purple-500" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden group">
          <CardContent className="p-0">
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-emerald-600">Active</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Catalog Status</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 transition-colors group-hover:bg-emerald-100">
                <CircleDollarSign className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
            <div className="h-1.5 bg-emerald-500" />
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[40px] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, code or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-2xl border-none bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all shadow-none font-medium"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none">
                <TableHead className="pl-10 py-6 font-black text-slate-400 text-[11px] uppercase tracking-[0.1em]">Course Details</TableHead>
                <TableHead className="py-6 font-black text-slate-400 text-[11px] uppercase tracking-[0.1em]">Code</TableHead>
                <TableHead className="py-6 font-black text-slate-400 text-[11px] uppercase tracking-[0.1em]">Department</TableHead>
                <TableHead className="py-6 font-black text-slate-400 text-[11px] uppercase tracking-[0.1em]">Duration</TableHead>
                <TableHead className="py-6 font-black text-slate-400 text-[11px] uppercase tracking-[0.1em]">Fees Structure</TableHead>
                <TableHead className="pr-10 py-6 font-black text-slate-400 text-[11px] uppercase tracking-[0.1em] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-200">
                      <BookOpen className="h-16 w-16 opacity-20" />
                      <p className="text-xl font-bold text-slate-400">No courses found in catalog</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCourses.map((course) => (
                  <TableRow key={course.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors group">
                    <TableCell className="pl-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                           {course.name.charAt(0)}
                        </div>
                        <p className="font-bold text-slate-900">{course.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-[11px] font-black bg-slate-100 px-2 py-1 rounded-md text-slate-600">
                        {course.code}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-500">
                      {course.department}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                        {course.duration}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs font-black text-emerald-600">
                        <CircleDollarSign className="h-3.5 w-3.5" />
                        {course.fees}
                      </div>
                    </TableCell>
                    <TableCell className="pr-10 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl">
                          <DropdownMenuItem onClick={() => handleOpenEdit(course)} className="rounded-lg">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Course
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(course.id)} className="text-destructive rounded-lg">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Course Dialog (Add/Edit) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <div className="bg-slate-900 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  {editingCourse ? <Edit className="h-6 w-6 text-blue-400" /> : <Plus className="h-6 w-6 text-blue-400" />}
                </div>
                {editingCourse ? "Edit Course" : "Add Course"}
              </DialogTitle>
              <p className="text-slate-400 font-medium mt-2">
                {editingCourse ? "Update the existing program details." : "Register a new academic program in the system."}
              </p>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Course Name</Label>
                <Input 
                  placeholder="e.g. B.Tech CS"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Course Code</Label>
                <Input 
                  placeholder="e.g. CS101"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium font-mono"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Department</Label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="e.g. Engineering"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Duration</Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="e.g. 4 Years"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Total Fees</Label>
                <div className="relative">
                  <CircleDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="e.g. ₹2,00,000"
                    value={formData.fees}
                    onChange={(e) => setFormData({...formData, fees: e.target.value})}
                    className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 flex gap-3 border-t border-slate-100">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="flex-1 h-14 rounded-2xl font-bold border-slate-200 hover:bg-white text-slate-600"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.name || !formData.code}
              className="flex-[2] h-14 rounded-2xl font-black bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200 transition-all hover:scale-[1.02] active:scale-95"
            >
              {editingCourse ? "Update Course" : "Add to Catalog"}
              {editingCourse ? <Edit className="h-4 w-4 ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] text-center pt-8 pb-10">
        Academic Catalog Management &bull; System Administrator
      </div>
    </div>
  )
}
