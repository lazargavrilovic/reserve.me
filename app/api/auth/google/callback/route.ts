import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { exchangeCodeForTokens } from "@/lib/google/calendar"
import type { Json } from "@/types/database"

export async function GET(req: NextRequest) {
  const staffUrl = new URL("/dashboard/staff", req.url)
  const code    = req.nextUrl.searchParams.get("code")
  const staffId = req.nextUrl.searchParams.get("state")
  const error   = req.nextUrl.searchParams.get("error")

  // User denied access or something went wrong
  if (error || !code || !staffId) {
    staffUrl.searchParams.set("gcal", "error")
    return NextResponse.redirect(staffUrl)
  }

  // Must be authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL("/login", req.url))

  try {
    const tokens = await exchangeCodeForTokens(code)
    const admin  = createAdminClient()

    await admin
      .from("staff_profiles")
      .update({ google_calendar_token: tokens as unknown as Json })
      .eq("id", staffId)

    staffUrl.searchParams.set("gcal", "connected")
  } catch (err) {
    console.error("[Google OAuth] callback error:", err)
    staffUrl.searchParams.set("gcal", "error")
  }

  return NextResponse.redirect(staffUrl)
}
