import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Dashboard — reserve.me" }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: membership } = await supabase
    .from("business_members")
    .select("business_id, businesses(name, slug)")
    .eq("user_id", user.id)
    .single()

  if (!membership) redirect("/onboarding")

  const business = membership.businesses as { name: string; slug: string } | null
  const admin = createAdminClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
  const weekEnd    = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString()

  const [
    { count: todayCount },
    { count: weekCount },
    { count: clientCount },
    { data: upcoming },
  ] = await Promise.all([
    admin.from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("business_id", membership.business_id)
      .gte("start_time", todayStart).lt("start_time", todayEnd)
      .eq("status", "confirmed"),
    admin.from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("business_id", membership.business_id)
      .gte("start_time", now.toISOString()).lt("start_time", weekEnd)
      .eq("status", "confirmed"),
    admin.from("clients")
      .select("*", { count: "exact", head: true })
      .eq("business_id", membership.business_id),
    admin.from("appointments")
      .select("id, client_name, start_time, end_time, service_id, staff_id")
      .eq("business_id", membership.business_id)
      .gte("start_time", now.toISOString())
      .eq("status", "confirmed")
      .order("start_time", { ascending: true })
      .limit(5),
  ])

  // Enrich upcoming with names
  const upcomingList = upcoming ?? []
  const svcIds  = Array.from(new Set(upcomingList.map(a => a.service_id)))
  const stfIds  = Array.from(new Set(upcomingList.map(a => a.staff_id)))

  const [{ data: svcs }, { data: stfs }] = await Promise.all([
    svcIds.length ? admin.from("services").select("id, name").in("id", svcIds) : { data: [] },
    stfIds.length ? admin.from("staff_profiles").select("id, display_name").in("id", stfIds) : { data: [] },
  ])

  const svcMap = Object.fromEntries((svcs ?? []).map(s => [s.id, s.name]))
  const stfMap = Object.fromEntries((stfs ?? []).map(s => [s.id, s.display_name]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{business ? `, ${business.name}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Booking page:{" "}
          <Link
            href={`/${business?.slug}`}
            target="_blank"
            className="font-medium text-foreground hover:underline"
          >
            reserve.me/{business?.slug}
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Appointments today" value={String(todayCount ?? 0)} />
        <StatCard label="This week" value={String(weekCount ?? 0)} />
        <StatCard label="Total clients" value={String(clientCount ?? 0)} />
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">Upcoming appointments</h2>
          <Link href="/dashboard/appointments" className="text-sm text-muted-foreground hover:text-foreground">
            View all →
          </Link>
        </div>

        {upcomingList.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">
            No upcoming appointments. Share your booking link to get started.
          </p>
        ) : (
          <div className="divide-y">
            {upcomingList.map((appt) => {
              const d = new Date(appt.start_time)
              const date = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
              const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
              return (
                <div key={appt.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-28 shrink-0">
                    <p className="text-xs text-muted-foreground">{date}</p>
                    <p className="font-medium text-sm">{time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{appt.client_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {svcMap[appt.service_id]} · {stfMap[appt.staff_id]}
                    </p>
                  </div>
                  <Badge variant="success">Confirmed</Badge>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}
