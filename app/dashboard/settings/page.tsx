import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { SettingsClient } from "./settings-client"

export const metadata = { title: "Settings — reserve.me" }

export default async function SettingsPage() {
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
  const { data: business } = await admin
    .from("businesses")
    .select("*")
    .eq("id", membership.business_id)
    .single()

  if (!business) redirect("/onboarding")

  return <SettingsClient business={business} />
}
