import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getGoogleAuthUrl } from "@/lib/google/calendar"

export async function GET(req: NextRequest) {
  const staffId = req.nextUrl.searchParams.get("staffId")
  if (!staffId) return new NextResponse("Missing staffId", { status: 400 })

  // Must be authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL("/login", req.url))

  // Verify the staff member belongs to this user's business
  const admin = createAdminClient()
  const { data: membership } = await admin
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id)
    .single()

  if (!membership) return new NextResponse("Not authorized", { status: 403 })

  const { data: staff } = await admin
    .from("staff_profiles")
    .select("id")
    .eq("id", staffId)
    .eq("business_id", membership.business_id)
    .single()

  if (!staff) return new NextResponse("Staff not found", { status: 404 })

  return NextResponse.redirect(getGoogleAuthUrl(staffId))
}
