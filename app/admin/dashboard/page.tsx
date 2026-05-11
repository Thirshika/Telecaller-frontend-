"use client"

import {
  Users,
  Phone,
  CheckCircle2,
  FileText,
  ClipboardList,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { useState, useEffect } from "react"

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData, statsData] = await Promise.all([
          api.getUsers(),
          api.getAdminStats()
        ])
        setUsers(userData)
        setStats(statsData)
      } catch (err) {
        console.error("Failed to load admin data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const statCards = [
    {
      title: "Total Prospects",
      value: stats?.totalProspects ?? 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Assigned Today",
      value: stats?.assignedToday ?? 0,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Calls Made Today",
      value: stats?.callsMadeToday ?? 0,
      icon: Phone,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Qualified Today",
      value: stats?.qualifiedToday ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Active SPOCs",
      value: users.filter((u) => u.role === "spoc").length,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Active Telecallers",
      value: users.filter((u) => u.role === "telecaller").length,
      icon: Phone,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ]

  if (isLoading) return <div className="p-8 text-center">Loading Admin Dashboard...</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of all operations and key metrics</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-sm border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("rounded-lg p-2", stat.bgColor)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Qualification Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats?.funnelData && stats.funnelData.some((d: any) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={stats.funnelData}
                    margin={{ top: 10, right: 60, left: 110, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={105} fontSize={12} />
                    <Tooltip formatter={(value: number) => [value, "Count"]} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 12 }}>
                      {stats.funnelData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No data available yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-base">Team Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[300px] overflow-y-auto">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold",
                      u.role === 'admin' ? "bg-red-100 text-red-600" : 
                      u.role === 'spoc' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {u.name.split(" ").map((n: any) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <Badge variant="outline" className="text-[10px] py-0 h-4">{u.role}</Badge>
                    </div>
                  </div>
                  <Badge variant={u.status === 'Active' ? "default" : "secondary"} className="text-[10px]">
                    {u.status || 'Active'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
