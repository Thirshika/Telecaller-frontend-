"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { mockFieldReports } from "@/lib/mock-data"
import { FileText, MapPin, Calendar, Users, School } from "lucide-react"

export default function FieldReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Field Reports</h1>
        <p className="text-muted-foreground">
          View all reports submitted by field agents from their visits.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockFieldReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Institutions Visited</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockFieldReports.reduce((acc, curr) => acc + curr.schoolsVisited + curr.coachingCentresVisited, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Areas Covered</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(mockFieldReports.map(r => r.areaLocation)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Schools</TableHead>
                <TableHead>Coaching</TableHead>
                <TableHead>Outreach</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockFieldReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    {new Date(report.reportDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{report.spocName || report.spokeName}</TableCell>
                  <TableCell>{report.areaLocation}</TableCell>
                  <TableCell>{report.schoolsVisited}</TableCell>
                  <TableCell>{report.coachingCentresVisited}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {report.brandingDone && <Badge variant="outline" className="text-[10px]">Branding</Badge>}
                      {report.corporateOutreach && <Badge variant="outline" className="text-[10px]">Corporate</Badge>}
                      {report.referralNetwork && <Badge variant="outline" className="text-[10px]">Referral</Badge>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
