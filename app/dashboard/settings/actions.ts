"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { slugify } from "@/lib/utils"

async function getVerifiedOwnership() {
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

export async function updateBusinessSettings(
  _prevState: { error: string | null; success: boolean },
  formData: FormData
) {
  const businessId = await getVerifiedOwnership()
  const admin = createAdminClient()

  const name        = (formData.get("name") as string).trim()
  const rawSlug     = (formData.get("slug") as string).trim()
  const description = (formData.get("description") as string).trim()
  const timezone    = formData.get("timezone") as string

  if (!name) return { error: "Business name is required.", success: false }

  const slug = slugify(rawSlug || name)
  if (!slug) return { error: "Invalid URL slug.", success: false }

  // Check slug is not taken by another business
  const { data: existing } = await admin
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .neq("id", businessId)
    .maybeSingle()

  if (existing) return { error: "That URL slug is already taken.", success: false }

  const { error } = await admin
    .from("businesses")
    .update({ name, slug, description: description || null, timezone })
    .eq("id", businessId)

  if (error) return { error: error.message, success: false }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/settings")
  return { error: null, success: true }
}
