"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Download, 
  FileText, 
  Phone, 
  MapPin,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  Target
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { api } from "@/lib/api"
import { mockUsers, mockCallLogs, mockFieldReports, mockProspects } from "@/lib/mock-data"

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#eab308', '#ec4899']

// Kept for UI scaffolding on other tabs for now
const visitAnalytics = [
  { date: 'Mon', visits: 12, successful: 8 },
  { date: 'Tue', visits: 15, successful: 11 },
  { date: 'Wed', visits: 10, successful: 7 },
  { date: 'Thu', visits: 18, successful: 14 },
  { date: 'Fri', visits: 14, successful: 10 },
  { date: 'Sat', visits: 8, successful: 5 },
  { date: 'Sun', visits: 4, successful: 2 },
]

const telecallerPerformance = mockUsers
  .filter(u => u.role === 'telecaller')
  .map(user => ({
    ...user,
    totalCalls: mockCallLogs.filter(c => c.telecallerId === user.id).length,
    successfulCalls: mockCallLogs.filter(c => c.telecallerId === user.id && c.outcome === 'interested').length,
    avgDuration: Math.round(mockCallLogs.filter(c => c.telecallerId === user.id).reduce((acc, c) => acc + c.duration, 0) / 
      (mockCallLogs.filter(c => c.telecallerId === user.id).length || 1)),
  }))

const spocPerformance = mockUsers
  .filter(u => u.role === 'spoc' || u.role === 'spoke')
  .map(user => ({
    ...user,
    totalVisits: mockFieldReports.filter(r => r.spocId === user.id).length,
    successfulVisits: mockFieldReports.filter(r => r.spocId === user.id && r.visitOutcome === 'enrolled').length,
    pendingFollowups: mockFieldReports.filter(r => r.spocId === user.id && r.followUpDate && r.followUpDate > new Date()).length,
  }))

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("7days")
  const [reportType, setReportType] = useState("overview")
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const loadData = async () => {
      try {
        const data = await api.getAdminStats()
        setStats(data)
      } catch (err) {
        console.error("Failed to load admin reports data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    intervalId = setInterval(loadData, 5000) // Live updates
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Performance metrics and insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px] print:hidden">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => window.print()} className="print:hidden">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList className="print:hidden">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="telecalling">Telecalling</TabsTrigger>
          <TabsTrigger value="spoc">SPOC</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats?.totalCalls ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Total Calls</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats?.totalFieldVisits ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Field Visits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {stats?.totalEnrollments ?? 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Enrollments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {stats?.totalProspects > 0 ? Math.round(((stats?.totalEnrollments ?? 0) / stats.totalProspects) * 100) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">Conversion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Call Activity</CardTitle>
                <CardDescription>Daily call volume and outcomes (Last 7 Days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {stats?.callAnalytics ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.callAnalytics}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar dataKey="calls" fill="#3b82f6" name="Total Calls" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="connected" fill="#10b981" name="Connected" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="converted" fill="#8b5cf6" name="Qualified" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outcome Distribution</CardTitle>
                <CardDescription>Call outcomes breakdown for all calls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {stats?.globalBreakdown && stats.globalBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.globalBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {stats.globalBreakdown.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No call outcomes logged yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </TabsContent>

        <TabsContent value="telecalling" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Telecaller Performance</CardTitle>
              <CardDescription>Individual telecaller metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Telecaller</TableHead>
                    <TableHead className="text-center">Total Calls</TableHead>
                    <TableHead className="text-center">Successful</TableHead>
                    <TableHead className="text-center">Success Rate</TableHead>
                    <TableHead className="text-center">Avg Duration</TableHead>
                    <TableHead className="text-center">Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {telecallerPerformance.map(user => {
                    const successRate = user.totalCalls > 0 
                      ? Math.round((user.successfulCalls / user.totalCalls) * 100) 
                      : 0
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{user.totalCalls}</TableCell>
                        <TableCell className="text-center">{user.successfulCalls}</TableCell>
                        <TableCell className="text-center">{successRate}%</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {user.avgDuration}s
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={successRate >= 30 ? "default" : successRate >= 15 ? "secondary" : "outline"}>
                            {successRate >= 30 ? "Excellent" : successRate >= 15 ? "Good" : "Needs Improvement"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Call Trends</CardTitle>
              <CardDescription>Weekly call volume trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {stats?.callAnalytics ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.callAnalytics}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="connected" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spoc" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>SPOC Field Reports</CardTitle>
              <CardDescription>Weekly field report submissions by SPOCs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {stats?.spocAnalytics ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.spocAnalytics}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="visits" fill="#10b981" name="Reports Submitted" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
