import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { StaffClient } from "./staff-client"

export const metadata = { title: "Staff — reserve.me" }

export default async function StaffPage() {
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

  const { data: staffProfiles } = await admin
    .from("staff_profiles")
    .select("*")
    .eq("business_id", membership.business_id)
    .order("display_name", { ascending: true })

  // Fetch availability for all staff in one query
  const staffIds = (staffProfiles ?? []).map((s) => s.id)
  const { data: availability } = staffIds.length
    ? await admin
        .from("availability")
        .select("*")
        .in("staff_id", staffIds)
        .order("day_of_week", { ascending: true })
    : { data: [] }

  // Attach availability to each staff member
  const staffWithAvailability = (staffProfiles ?? []).map((s) => ({
    ...s,
    availability: (availability ?? []).filter((a) => a.staff_id === s.id),
  }))

  return <StaffClient staff={staffWithAvailability} />
}
