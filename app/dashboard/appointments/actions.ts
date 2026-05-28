"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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

  await admin
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .eq("business_id", businessId)

  revalidatePath("/dashboard/appointments")
}
