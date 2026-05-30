"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { sendBookingConfirmation } from "@/lib/email/send-booking-confirmation"
import { createCalendarEvent, type GoogleTokens } from "@/lib/google/calendar"
import { randomUUID } from "crypto"

export interface BookingResult {
  success: boolean
  appointmentId?: string
  error?: string
}

export async function createAppointment(data: {
  businessId: string
  serviceId: string
  staffId: string
  date: string        // YYYY-MM-DD
  startTime: string   // HH:mm
  endTime: string     // HH:mm
  clientName: string
  clientEmail: string
  clientPhone: string
  notes: string
  timezone: string
}): Promise<BookingResult> {
  const admin = createAdminClient()

  const startISO = `${data.date}T${data.startTime}:00`
  const endISO = `${data.date}T${data.endTime}:00`

  // Double-check the slot is still free
  const { data: conflict } = await admin
    .from("appointments")
    .select("id")
    .eq("staff_id", data.staffId)
    .lt("start_time", endISO)
    .gt("end_time", startISO)
    .neq("status", "cancelled")
    .limit(1)
    .maybeSingle()

  if (conflict) {
    return { success: false, error: "That time slot was just taken. Please pick another time." }
  }

  // Upsert client record
  await admin.from("clients").upsert(
    {
      business_id: data.businessId,
      email: data.clientEmail,
      full_name: data.clientName,
      phone: data.clientPhone || null,
    },
    { onConflict: "business_id,email", ignoreDuplicates: false }
  )

  const icalUid = randomUUID()

  const { data: appointment, error } = await admin
    .from("appointments")
    .insert({
      business_id: data.businessId,
      service_id: data.serviceId,
      staff_id: data.staffId,
      client_name: data.clientName,
      client_email: data.clientEmail,
      client_phone: data.clientPhone || null,
      start_time: startISO,
      end_time: endISO,
      status: "confirmed",
      notes: data.notes || null,
      ical_uid: icalUid,
    })
    .select("id")
    .single()

  if (error) return { success: false, error: error.message }

  // Fetch business + service + staff (including Google Calendar token)
  const [{ data: business }, { data: service }, { data: staff }] = await Promise.all([
    admin.from("businesses").select("name, slug").eq("id", data.businessId).single(),
    admin.from("services").select("name").eq("id", data.serviceId).single(),
    admin.from("staff_profiles").select("display_name, google_calendar_token").eq("id", data.staffId).single(),
  ])

  // Send confirmation email
  if (process.env.RESEND_API_KEY) {
    try {
      await sendBookingConfirmation({
        appointmentId: appointment.id,
        icalUid,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        businessName: business?.name ?? "",
        businessSlug: business?.slug ?? "",
        serviceName: service?.name ?? "",
        staffName: staff?.display_name ?? "",
        startISO,
        endISO,
      })
    } catch (err) {
      console.error("[Email] Exception:", err)
    }
  }

  // Sync to Google Calendar if the staff member has connected their account
  if (staff?.google_calendar_token) {
    try {
      const tokens = staff.google_calendar_token as unknown as GoogleTokens
      const descParts = [
        `Client: ${data.clientName}`,
        `Email: ${data.clientEmail}`,
        data.clientPhone ? `Phone: ${data.clientPhone}` : null,
        data.notes       ? `Notes: ${data.notes}`       : null,
      ].filter(Boolean) as string[]

      const eventId = await createCalendarEvent(tokens, {
        summary:     `${service?.name ?? "Appointment"} — ${data.clientName}`,
        description: descParts.join("\n"),
        startISO,
        endISO,
      })

      if (eventId) {
        await admin
          .from("appointments")
          .update({ google_event_id: eventId })
          .eq("id", appointment.id)
      }
    } catch (err) {
      console.error("[Google Calendar] Failed to create event:", err)
    }
  }

  return { success: true, appointmentId: appointment.id }
}
