"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { deleteCalendarEvent, type GoogleTokens } from "@/lib/google/calendar"
import type { AppointmentStatus } from "@/types/database"

async function getVerifiedBusinessId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: membership } = await supabase
    .from("business_members")
    .select("business_id, role")
    .eq("user_id", user.id)
    .single()

  if (!membership) throw new Error("Not authorized")
  return membership.business_id
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const businessId = await getVerifiedBusinessId()
  const admin = createAdminClient()

  // Update the appointment status
  await admin
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .eq("business_id", businessId)

  // If cancelled, remove the Google Calendar event
  if (status === "cancelled") {
    try {
      const { data: appt } = await admin
        .from("appointments")
        .select("google_event_id, staff_id")
        .eq("id", id)
        .single()

      if (appt?.google_event_id) {
        const { data: staffProfile } = await admin
          .from("staff_profiles")
          .select("google_calendar_token")
          .eq("id", appt.staff_id)
          .single()

        if (staffProfile?.google_calendar_token) {
          await deleteCalendarEvent(
            staffProfile.google_calendar_token as unknown as GoogleTokens,
            appt.google_event_id
          )
        }
      }
    } catch (err) {
      console.error("[Google Calendar] Failed to delete event on cancellation:", err)
    }
  }

  revalidatePath("/dashboard/appointments")
}
