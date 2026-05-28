import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient()

  const { data: appt } = await admin
    .from("appointments")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!appt) return new NextResponse("Not found", { status: 404 })

  const [{ data: service }, { data: staff }, { data: biz }] = await Promise.all([
    admin.from("services").select("name").eq("id", appt.service_id).single(),
    admin.from("staff_profiles").select("display_name").eq("id", appt.staff_id).single(),
    admin.from("businesses").select("name, slug").eq("id", appt.business_id).single(),
  ])

  const dtStart = new Date(appt.start_time).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  const dtEnd = new Date(appt.end_time).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//reserve.me//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${appt.ical_uid ?? appt.id}@reserve.me`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${service?.name ?? "Appointment"} at ${biz?.name ?? ""}`,
    `DESCRIPTION:Staff: ${staff?.display_name ?? ""}\\nBooked via reserve.me`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="appointment.ics"`,
    },
  })
}
