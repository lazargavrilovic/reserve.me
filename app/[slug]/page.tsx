import { notFound } from "next/navigation"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatPrice, formatDuration } from "@/lib/utils"
import { Clock, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const admin = createAdminClient()
  const { data: business } = await admin
    .from("businesses")
    .select("name, description")
    .eq("slug", params.slug)
    .single()

  if (!business) return { title: "Not found" }
  return {
    title: `Book at ${business.name} — reserve.me`,
    description: business.description ?? `Book an appointment at ${business.name}`,
  }
}

export default async function BusinessPage({ params }: Props) {
  const admin = createAdminClient()

  const { data: business } = await admin
    .from("businesses")
    .select("*")
    .eq("slug", params.slug)
    .single()

  if (!business) notFound()

  const { data: services } = await admin
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("name")

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Business header */}
      <div className="text-center mb-10">
        {business.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logo_url}
            alt={business.name}
            className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border"
          />
        )}
        <h1 className="text-3xl font-bold tracking-tight">{business.name}</h1>
        {business.description && (
          <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
            {business.description}
          </p>
        )}
      </div>

      {/* Services */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Services
      </h2>

      {(!services || services.length === 0) ? (
        <p className="text-muted-foreground text-sm">No services available yet.</p>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="rounded-xl border bg-card p-5 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{service.name}</p>
                {service.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(service.duration_minutes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    {formatPrice(service.price_cents, service.currency)}
                  </span>
                </div>
              </div>
              <Button asChild>
                <Link href={`/${params.slug}/book/${service.id}`}>
                  Book
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground mt-12">
        Powered by{" "}
        <Link href="/" className="hover:underline font-medium">
          reserve.me
        </Link>
      </p>
    </div>
  )
}
