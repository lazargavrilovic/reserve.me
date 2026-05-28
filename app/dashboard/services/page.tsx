import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ServicesClient } from "./services-client"

export const metadata = { title: "Services — reserve.me" }

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: membership } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id)
    .single()

  if (!membership) redirect("/onboarding")

  const admin = createAdminClient()
  const { data: services } = await admin
    .from("services")
    .select("*")
    .eq("business_id", membership.business_id)
    .order("created_at", { ascending: true })

  return <ServicesClient services={services ?? []} />
}
