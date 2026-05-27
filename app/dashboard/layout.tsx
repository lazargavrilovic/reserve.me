import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard/nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: membership } = await supabase
    .from("business_members")
    .select("business_id, role, businesses(id, name, slug)")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (!membership) redirect("/onboarding")

  const business = membership.businesses as { id: string; name: string; slug: string }

  return (
    <div className="min-h-screen flex">
      <DashboardNav business={business} userRole={membership.role} />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
