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

  if (!membership || membership.role !== "owner") {
    throw new Error("Not authorized")
  }

  return membership.business_id
}

export async function createService(_prevState: unknown, formData: FormData) {
  const businessId = await getVerifiedBusinessId()
  const admin = createAdminClient()

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const duration = parseInt(formData.get("duration") as string)
  const price = Math.round(parseFloat(formData.get("price") as string) * 100)
  const currency = (formData.get("currency") as string) || "USD"

  if (!name || isNaN(duration) || isNaN(price)) {
    return { error: "Please fill in all required fields." }
  }

  const { error } = await admin.from("services").insert({
    business_id: businessId,
    name,
    description: description || null,
    duration_minutes: duration,
    price_cents: price,
    currency,
  })

  if (error) return { error: error.message }

  revalidatePath("/dashboard/services")
  return { error: null }
}

export async function updateService(_prevState: unknown, formData: FormData) {
  const businessId = await getVerifiedBusinessId()
  const admin = createAdminClient()

  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const duration = parseInt(formData.get("duration") as string)
  const price = Math.round(parseFloat(formData.get("price") as string) * 100)
  const currency = (formData.get("currency") as string) || "USD"

  if (!name || isNaN(duration) || isNaN(price)) {
    return { error: "Please fill in all required fields." }
  }

  const { error } = await admin
    .from("services")
    .update({ name, description: description || null, duration_minutes: duration, price_cents: price, currency })
    .eq("id", id)
    .eq("business_id", businessId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/services")
  return { error: null }
}

export async function toggleServiceStatus(id: string, isActive: boolean) {
  const businessId = await getVerifiedBusinessId()
  const admin = createAdminClient()

  await admin
    .from("services")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("business_id", businessId)

  revalidatePath("/dashboard/services")
}

export async function deleteService(id: string) {
  const businessId = await getVerifiedBusinessId()
  const admin = createAdminClient()

  await admin
    .from("services")
    .delete()
    .eq("id", id)
    .eq("business_id", businessId)

  revalidatePath("/dashboard/services")
}
