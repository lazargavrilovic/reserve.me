"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function getVerifiedBusinessId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: membership } = await supabase
    .from("business_members")
    .select("business_id, role")
    .eq("user_id", user.id)
    .single()

  if (!membership || membership.role !== "owner") throw new Error("Not authorized")
  return membership.business_id
}

export async function createStaff(_prevState: unknown, formData: FormData) {
  const businessId = await getVerifiedBusinessId()
  const admin = createAdminClient()

  const displayName = formData.get("display_name") as string
  const bio = formData.get("bio") as string

  if (!displayName) return { error: "Name is required." }

  const { error } = await admin.from("staff_profiles").insert({
    business_id: businessId,
    display_name: displayName,
    bio: bio || null,
  })

  if (error) return { error: error.message }

  revalidatePath("/dashboard/staff")
  return { error: null }
}

export async function updateStaff(_prevState: unknown, formData: FormData) {
  const businessId = await getVerifiedBusinessId()
  const admin = createAdminClient()

  const id = formData.get("id") as string
  const displayName = formData.get("display_name") as string
  const bio = formData.get("bio") as string

  if (!displayName) return { error: "Name is required." }

  const { error } = await admin
    .from("staff_profiles")
    .update({ display_name: displayName, bio: bio || null })
    .eq("id", id)
    .eq("business_id", businessId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/staff")
  return { error: null }
}

export async function deleteStaff(id: string) {
  const businessId = await getVerifiedBusinessId()
  const admin = createAdminClient()

  await admin
    .from("staff_profiles")
    .delete()
    .eq("id", id)
    .eq("business_id", businessId)

  revalidatePath("/dashboard/staff")
}

// Save weekly availability for a staff member
// Replaces all existing rows for that staff member
export async function saveAvailability(staffId: string, slots: {
  day_of_week: number
  start_time: string
  end_time: string
}[]) {
  const businessId = await getVerifiedBusinessId()
  const admin = createAdminClient()

  // Verify the staff member belongs to this business
  const { data: staff } = await admin
    .from("staff_profiles")
    .select("id")
    .eq("id", staffId)
    .eq("business_id", businessId)
    .single()

  if (!staff) throw new Error("Staff not found")

  // Delete all existing availability and replace
  await admin.from("availability").delete().eq("staff_id", staffId)

  if (slots.length > 0) {
    await admin.from("availability").insert(
      slots.map((s) => ({ ...s, staff_id: staffId }))
    )
  }

  revalidatePath("/dashboard/staff")
}
