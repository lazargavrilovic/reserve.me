"use server"

import { createAdminClient } from "@/lib/supabase/admin"
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

  // Build timestamps in the business timezone
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

  return { success: true, appointmentId: appointment.id }
}
