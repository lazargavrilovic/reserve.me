import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { BillingClient } from "./billing-client"

export const metadata = { title: "Billing — reserve.me" }

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: membership } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id)
    .single()

  if (!membership) redirect("/onboarding")

  const admin = createAdminClient()
  const { data: business } = await admin
    .from("businesses")
    .select("id, name, subscription_status, subscription_plan, paddle_subscription_id")
    .eq("id", membership.business_id)
    .single()

  if (!business) redirect("/onboarding")

  return (
    <BillingClient
      businessId={business.id}
      businessName={business.name}
      userEmail={user.email ?? ""}
      status={(business.subscription_status as string) ?? "trial"}
      plan={(business.subscription_plan as string) ?? "trial"}
      hasSubscription={!!business.paddle_subscription_id}
    />
  )
}
