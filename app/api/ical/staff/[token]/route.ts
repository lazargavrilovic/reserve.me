import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateCalendarFeed } from "@/lib/ical/generate"

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const admin = createAdminClient()

  // Resolve staff member by their private token
  const { data: staff } = await admin
    .from("staff_profiles")
    .select("id, display_name")
    .eq("ical_feed_url", params.token)
    .single()

  if (!staff) {
    return new NextResponse("Calendar not found", { status: 404 })
  }

  // Fetch all confirmed + completed appointments for this staff member
  const { data: appointments } = await admin
    .from("appointments")
    .select("id, service_id, client_name, client_email, client_phone, start_time, end_time, status, notes, ical_uid")
    .eq("staff_id", staff.id)
    .in("status", ["confirmed", "completed"])
    .order("start_time", { ascending: true })

  const apptList = appointments ?? []

  // Resolve service names
  const serviceIds = Array.from(new Set(apptList.map((a) => a.service_id)))
  const { data: services } = serviceIds.length
    ? await admin.from("services").select("id, name").in("id", serviceIds)
    : { data: [] }

  const serviceMap = Object.fromEntries((services ?? []).map((s) => [s.id, s.name]))

  // Build event list
  const events = apptList.map((appt) => {
    const descParts = [
      `Client: ${appt.client_name}`,
      `Email: ${appt.client_email}`,
      appt.client_phone ? `Phone: ${appt.client_phone}` : null,
      appt.notes       ? `Notes: ${appt.notes}`        : null,
    ].filter(Boolean) as string[]

    return {
      uid: appt.ical_uid ?? appt.id,
      summary: `${serviceMap[appt.service_id] ?? "Appointment"} — ${appt.client_name}`,
      description: descParts.join("\n"),
      startISO: appt.start_time,
      endISO:   appt.end_time,
    }
  })

  const calendarName = `${staff.display_name} — reserve.me`
  const ics = generateCalendarFeed(calendarName, events)

  const slug = staff.display_name.toLowerCase().replace(/\s+/g, "-")

  return new NextResponse(ics, {
    headers: {
      "Content-Type":        "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="appointments-${slug}.ics"`,
      "Cache-Control":       "no-cache, no-store, must-revalidate",
    },
  })
}
