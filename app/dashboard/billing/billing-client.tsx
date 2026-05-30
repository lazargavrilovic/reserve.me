"use client"

import { useState } from "react"
import Script from "next/script"
import { CheckCircle2, Zap, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Minimal Paddle.js type declarations
declare global {
  interface Window {
    Paddle?: {
      Initialize: (opts: { token: string; environment?: string }) => void
      Checkout: {
        open: (opts: {
          items: Array<{ priceId: string; quantity: number }>
          customer?: { email: string }
          customData?: Record<string, string>
          successUrl?: string
        }) => void
      }
    }
  }
}

interface Plan {
  key:      string
  name:     string
  price:    string
  priceId:  string
  features: string[]
  highlight?: boolean
}

const PLANS: Plan[] = [
  {
    key:     "starter",
    name:    "Starter",
    price:   "€10 / month",
    priceId: process.env.NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID!,
    features: [
      "Unlimited bookings",
      "Up to 2 staff members",
      "Email confirmations",
      "Google Calendar sync",
      "iCal feed",
    ],
  },
  {
    key:     "pro",
    name:    "Pro",
    price:   "€29 / month",
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID!,
    features: [
      "Everything in Starter",
      "Unlimited staff members",
      "Priority support",
      "Custom domain (coming soon)",
      "Analytics (coming soon)",
    ],
    highlight: true,
  },
]

interface Props {
  businessId:      string
  businessName:    string
  userEmail:       string
  status:          string
  plan:            string
  hasSubscription: boolean
}

export function BillingClient({
  businessId,
  businessName,
  userEmail,
  status,
  plan,
  hasSubscription: _hasSubscription,
}: Props) {
  const [paddleReady, setPaddleReady] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  function initPaddle() {
    if (!window.Paddle) return
    window.Paddle.Initialize({
      token:       process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT ?? "sandbox",
    })
    setPaddleReady(true)
  }

  function openCheckout(priceId: string, planKey: string) {
    if (!window.Paddle) return
    setLoading(planKey)
    window.Paddle.Checkout.open({
      items:      [{ priceId, quantity: 1 }],
      customer:   { email: userEmail },
      customData: { businessId },
      successUrl: `${window.location.origin}/dashboard/billing?success=1`,
    })
    setLoading(null)
  }

  const isActive    = status === "active"
  const isCanceled  = status === "canceled"
  const isPastDue   = status === "past_due"

  const statusLabel: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
    trial:    { label: "Free trial",   variant: "secondary" },
    active:   { label: "Active",       variant: "success"   },
    past_due: { label: "Past due",     variant: "warning"   },
    canceled: { label: "Cancelled",    variant: "destructive"},
  }
  const currentStatus = statusLabel[status] ?? statusLabel["trial"]

  return (
    <>
      {/* Load Paddle.js */}
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        onLoad={initPaddle}
      />

      <div className="space-y-8 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your {businessName} subscription
          </p>
        </div>

        {/* Current plan status */}
        <div className="rounded-lg border bg-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="text-lg font-semibold capitalize mt-0.5">
              {isActive ? plan : "Free trial"}
            </p>
          </div>
          <Badge variant={currentStatus.variant}>{currentStatus.label}</Badge>
        </div>

        {isPastDue && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            ⚠️ Your last payment failed. Please update your payment method to keep access.
          </div>
        )}

        {isCanceled && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            Your subscription has been cancelled. Subscribe again to re-enable your booking page.
          </div>
        )}

        {/* Plan cards */}
        {(!isActive || isPastDue) && (
          <>
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Choose a plan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PLANS.map((p) => {
                const isCurrent = isActive && plan === p.key
                return (
                  <div
                    key={p.key}
                    className={`rounded-lg border bg-card p-6 space-y-4 relative ${
                      p.highlight ? "border-primary shadow-sm" : ""
                    }`}
                  >
                    {p.highlight && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-0.5 rounded-full">
                        Most popular
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {p.key === "starter" ? (
                        <Zap className="w-5 h-5 text-primary" />
                      ) : (
                        <Star className="w-5 h-5 text-primary" />
                      )}
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.price}</p>
                      </div>
                    </div>

                    <ul className="space-y-1.5">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={p.highlight ? "default" : "outline"}
                      disabled={!paddleReady || loading === p.key || isCurrent}
                      onClick={() => openCheckout(p.priceId, p.key)}
                    >
                      {isCurrent
                        ? "Current plan"
                        : loading === p.key
                        ? "Opening…"
                        : `Subscribe to ${p.name}`}
                    </Button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {isActive && !isPastDue && (
          <div className="rounded-lg border bg-card p-6 space-y-2">
            <p className="font-semibold">Manage subscription</p>
            <p className="text-sm text-muted-foreground">
              To cancel or update your payment method, contact support or manage via Paddle.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
