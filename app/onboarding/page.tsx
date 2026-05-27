import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingForm } from "./onboarding-form"

export const metadata = {
  title: "Set up your business — reserve.me",
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // If they already have a business, skip onboarding
  const { data: membership } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (membership) redirect("/dashboard")

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Set up your business</h1>
          <p className="text-sm text-muted-foreground mt-1">
            This takes 2 minutes. You can change everything later.
          </p>
        </div>
        <OnboardingForm userId={user.id} />
      </div>
    </div>
  )
}
