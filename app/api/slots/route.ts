import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateAvailableSlots } from "@/lib/booking/slots"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const staffId = searchParams.get("staffId")
  const serviceId = searchParams.get("serviceId")
  const date = searchParams.get("date") // YYYY-MM-DD

  if (!staffId || !serviceId || !date) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get service duration
  const { data: service } = await admin
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .single()

  if (!service) return NextResponse.json({ slots: [] })

  // Get staff availability for that day of week
  const dayOfWeek = new Date(date + "T00:00:00").getDay()
  const { data: avail } = await admin
    .from("availability")
    .select("start_time, end_time")
    .eq("staff_id", staffId)
    .eq("day_of_week", dayOfWeek)
    .single()

  if (!avail) return NextResponse.json({ slots: [] })

  // Check for a full-day override (day off)
  const { data: override } = await admin
    .from("availability_overrides")
    .select("is_unavailable")
    .eq("staff_id", staffId)
    .eq("date", date)
    .eq("is_unavailable", true)
    .maybeSingle()

  if (override) return NextResponse.json({ slots: [] })

  // Get existing confirmed appointments for that day
  const { data: appointments } = await admin
    .from("appointments")
    .select("start_time, end_time")
    .eq("staff_id", staffId)
    .gte("start_time", `${date}T00:00:00`)
    .lt("start_time", `${date}T23:59:59`)
    .neq("status", "cancelled")

  const slots = generateAvailableSlots({
    availStart: avail.start_time.slice(0, 5),
    availEnd: avail.end_time.slice(0, 5),
    durationMinutes: service.duration_minutes,
    bookedSlots: (appointments ?? []).map((a) => ({
      start_time: new Date(a.start_time).toTimeString().slice(0, 5),
      end_time: new Date(a.end_time).toTimeString().slice(0, 5),
    })),
    date,
  })

  return NextResponse.json({ slots })
}
