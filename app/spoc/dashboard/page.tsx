"use client"

import { useState, useEffect } from "react"
import { 
  Calendar, 
  FileText, 
  ClipboardList, 
  PhoneCall, 
  Plus, 
  FolderOpen, 
  ChevronRight,
  Clock,
  MapPin,
  Building2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function SpocDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [followups, setFollowups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const loadDashboardData = async () => {
      if (!user) return
      try {
        const [statsData, reportsData, followupsData] = await Promise.all([
          api.getSpocStats(user.id),
          api.getFieldReports(user.id),
          api.getSpocFollowUps(user.id)
        ])
        setStats(statsData)
        setReports(reportsData.slice(0, 3))
        setFollowups(followupsData)
      } catch (err) {
        console.error("Failed to load dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
    // Live updates polling
    intervalId = setInterval(loadDashboardData, 5000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [user])

  const today = new Date()
  const dateString = today.toLocaleDateString('en-IN', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 font-medium">{dateString}</p>
        </div>
        <Link href="/spoc/report/new">
          <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white shadow-md">
            <Plus className="h-5 w-5 mr-2" />
            Submit Today's Report
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </h3>
              <p className="text-xs text-slate-500 font-medium">Today's Date</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <FileText className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{stats?.personalStats?.totalReports || 0}</h3>
              <p className="text-xs text-slate-500 font-medium">Reports This Month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{stats?.personalStats?.tcFollowupsRaised || 0}</h3>
              <p className="text-xs text-slate-500 font-medium">My Raised Tasks</p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Quick Actions */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold text-slate-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/spoc/report/new" className="group">
              <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                <div className="h-10 w-10 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <Plus className="h-5 w-5 text-slate-600 group-hover:text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">New Report</h4>
                  <p className="text-xs text-slate-500">Submit today's field report</p>
                </div>
              </div>
            </Link>

            <Link href="/spoc/reports" className="group">
              <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                <div className="h-10 w-10 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <FolderOpen className="h-5 w-5 text-slate-600 group-hover:text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Past Reports</h4>
                  <p className="text-xs text-slate-500">View submitted reports</p>
                </div>
              </div>
            </Link>

            <Link href="/spoc/followups" className="group">
              <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                <div className="h-10 w-10 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <ClipboardList className="h-5 w-5 text-slate-600 group-hover:text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">My Follow-ups</h4>
                  <p className="text-xs text-slate-500">View pending tasks</p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reports Section */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-bold text-slate-900">Recent Reports</CardTitle>
            <Link href="/spoc/reports" className="text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900">{report.areaLocation}</h4>
                      <p className="text-xs text-slate-500 font-medium">{new Date(report.reportDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-slate-400">
                          {report.schoolsVisited} schools • {report.coachingCentresVisited} centres
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 font-medium">No reports submitted yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Follow-ups Section */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-bold text-slate-900">Pending Follow-ups</CardTitle>
            <Link href="/spoc/followups" className="text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {followups.filter(f => f.status === 'Pending').length > 0 ? (
                followups.filter(f => f.status === 'Pending').map((followup) => (
                  <div key={followup.id} className="p-4 rounded-xl border-2 border-slate-50 hover:border-slate-100 hover:bg-slate-50/50 transition-all cursor-pointer group relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-900">{followup.institutionName}</h4>
                        <p className="text-xs text-slate-500 font-medium">{followup.actionDescription}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                          <Clock className="h-3 w-3" />
                          Due: {followup.followUpDate}
                        </div>
                      </div>
                      <Badge className={cn(
                        "border-none rounded-full px-3 py-1 flex items-center gap-1",
                        followup.status === 'Pending' ? "bg-yellow-100 text-yellow-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {followup.status === 'Pending' && <div className="h-1 w-1 rounded-full bg-yellow-500 animate-pulse" />}
                        {followup.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 font-medium">No pending follow-ups</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
