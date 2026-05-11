"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/lib/auth-context"

export default function SpocLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()

  return (
    <DashboardLayout role="spoc" userName={user?.name || "SPOC"}>
      {children}
    </DashboardLayout>
  )
}
