import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { AppointmentsClient } from "./appointments-client"

export const metadata = { title: "Appointments — reserve.me" }

export default async function AppointmentsPage() {
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

  // Fetch appointments for the last 30 days and next 60 days
  const from = new Date()
  from.setDate(from.getDate() - 30)
  const to = new Date()
  to.setDate(to.getDate() + 60)

  const { data: appointments } = await admin
    .from("appointments")
    .select("*")
    .eq("business_id", membership.business_id)
    .gte("start_time", from.toISOString())
    .lte("start_time", to.toISOString())
    .order("start_time", { ascending: true })

  // Fetch service and staff names in one go
  const apptList = appointments ?? []
  const serviceIds = Array.from(new Set(apptList.map(a => a.service_id)))
  const staffIds   = Array.from(new Set(apptList.map(a => a.staff_id)))

  const [{ data: services }, { data: staffList }] = await Promise.all([
    serviceIds.length
      ? admin.from("services").select("id, name").in("id", serviceIds)
      : { data: [] },
    staffIds.length
      ? admin.from("staff_profiles").select("id, display_name").in("id", staffIds)
      : { data: [] },
  ])

  const serviceMap = Object.fromEntries((services ?? []).map(s => [s.id, s.name]))
  const staffMap   = Object.fromEntries((staffList ?? []).map(s => [s.id, s.display_name]))

  const enriched = apptList.map(a => ({
    ...a,
    service_name: serviceMap[a.service_id] ?? "—",
    staff_name:   staffMap[a.staff_id]   ?? "—",
  }))

  return <AppointmentsClient appointments={enriched} />
}
