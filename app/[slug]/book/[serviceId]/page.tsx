import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { BookingWizard } from "./booking-wizard"

interface Props {
  params: { slug: string; serviceId: string }
}

export default async function BookingPage({ params }: Props) {
  const admin = createAdminClient()

  const { data: business } = await admin
    .from("businesses")
    .select("id, name, slug, timezone")
    .eq("slug", params.slug)
    .single()

  if (!business) notFound()

  const { data: service } = await admin
    .from("services")
    .select("*")
    .eq("id", params.serviceId)
    .eq("business_id", business.id)
    .eq("is_active", true)
    .single()

  if (!service) notFound()

  const { data: staffList } = await admin
    .from("staff_profiles")
    .select("*")
    .eq("business_id", business.id)

  if (!staffList || staffList.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">
          This business hasn&apos;t set up staff yet. Check back soon.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <BookingWizard
        business={business}
        service={service}
        staffList={staffList}
      />
    </div>
  )
}
