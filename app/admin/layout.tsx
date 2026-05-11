"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/lib/auth-context"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()

  return (
    <DashboardLayout role="admin" userName={user?.name || "Administrator"}>
      {children}
    </DashboardLayout>
  )
}
