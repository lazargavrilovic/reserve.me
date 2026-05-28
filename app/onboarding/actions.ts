"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { slugify } from "@/lib/utils"

export async function createBusiness(_prevState: unknown, formData: FormData) {
  // Use regular client only to verify the session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const businessName = formData.get("businessName") as string
  const slug = slugify(formData.get("slug") as string)
  const timezone = formData.get("timezone") as string

  if (!businessName || !slug) {
    return { error: "Business name is required." }
  }

  // Use admin client for DB writes — bypasses RLS (safe: user is verified above)
  const admin = createAdminClient()

  const { data: business, error: bizError } = await admin
    .from("businesses")
    .insert({ name: businessName, slug, timezone })
    .select("id")
    .single()

  if (bizError) {
    return {
      error:
        bizError.code === "23505"
          ? "That URL slug is already taken. Try a different business name."
          : bizError.message,
    }
  }

  const { error: memberError } = await admin
    .from("business_members")
    .insert({ business_id: business.id, user_id: user.id, role: "owner" })

  if (memberError) return { error: memberError.message }

  await admin.from("staff_profiles").insert({
    business_id: business.id,
    user_id: user.id,
    display_name: businessName,
  })

  redirect("/dashboard")
}
