"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/lib/auth-context"

export default function TelecallerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()

  return (
    <DashboardLayout role="telecaller" userName={user?.name || "Telecaller"}>
      {children}
    </DashboardLayout>
  )
}
