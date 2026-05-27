import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Dashboard — reserve.me",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: membership } = await supabase
    .from("business_members")
    .select("businesses(name, slug, subscription_status)")
    .eq("user_id", user!.id)
    .single()

  const business = membership?.businesses as {
    name: string
    slug: string
    subscription_status: string
  } | null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{business ? `, ${business.name}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your booking page is live at{" "}
          <span className="font-medium text-foreground">
            reserve.me/{business?.slug}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Appointments today" value="—" />
        <StatCard label="This week" value="—" />
        <StatCard label="Total clients" value="—" />
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="font-semibold mb-4">Upcoming appointments</h2>
        <p className="text-sm text-muted-foreground">
          No upcoming appointments yet. Share your booking link to get started.
        </p>
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
