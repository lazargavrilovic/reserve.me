import { NextRequest, NextResponse } from "next/server"
import { EventName } from "@paddle/paddle-node-sdk"
import { getPaddleClient } from "@/lib/paddle/client"
import { createAdminClient } from "@/lib/supabase/admin"

// Paddle requires the raw body for signature verification — disable body parsing
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const rawBody  = await req.text()
  const signature = req.headers.get("paddle-signature") ?? ""

  let event
  try {
    event = await getPaddleClient().webhooks.unmarshal(
      rawBody,
      process.env.PADDLE_WEBHOOK_SECRET!,
      signature
    )
  } catch (err) {
    console.error("[Paddle webhook] Signature verification failed:", err)
    return new NextResponse("Invalid signature", { status: 400 })
  }

  const admin = createAdminClient()

  try {
    switch (event.eventType) {
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionUpdated: {
        const sub        = event.data
        const businessId = (sub.customData as Record<string, string> | null)?.businessId
        if (!businessId) break

        // Map Paddle subscription status → our status
        const statusMap: Record<string, string> = {
          active:   "active",
          past_due: "past_due",
          canceled: "canceled",
          trialing: "trial",
          paused:   "past_due",
        }
        const newStatus = statusMap[sub.status] ?? "active"

        // Determine plan from priceId
        const priceId = sub.items?.[0]?.price?.id ?? ""
        const plan =
          priceId === process.env.PADDLE_STARTER_PRICE_ID ? "starter"
          : priceId === process.env.PADDLE_PRO_PRICE_ID   ? "pro"
          : "starter"

        await admin
          .from("businesses")
          .update({
            paddle_customer_id:     sub.customerId,
            paddle_subscription_id: sub.id,
            subscription_status:    newStatus as "trial" | "active" | "past_due" | "canceled",
            subscription_plan:      plan,
          })
          .eq("id", businessId)

        break
      }

      case EventName.SubscriptionCanceled: {
        const sub        = event.data
        const businessId = (sub.customData as Record<string, string> | null)?.businessId
        if (!businessId) break

        await admin
          .from("businesses")
          .update({ subscription_status: "canceled", subscription_plan: "trial" })
          .eq("id", businessId)

        break
      }

      default:
        // Ignore other events
        break
    }
  } catch (err) {
    console.error("[Paddle webhook] Handler error:", err)
    return new NextResponse("Handler error", { status: 500 })
  }

  return new NextResponse("OK", { status: 200 })
}
