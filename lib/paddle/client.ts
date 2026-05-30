import { Paddle, Environment } from "@paddle/paddle-node-sdk"

let _paddle: Paddle | null = null

export function getPaddleClient(): Paddle {
  if (!_paddle) {
    _paddle = new Paddle(process.env.PADDLE_API_KEY!, {
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox"
          ? Environment.sandbox
          : Environment.production,
    })
  }
  return _paddle
}

export const PLAN_PRICES: Record<string, { priceId: string; name: string; amount: string }> = {
  starter: {
    priceId: process.env.PADDLE_STARTER_PRICE_ID!,
    name:    "Starter",
    amount:  "€10 / month",
  },
  pro: {
    priceId: process.env.PADDLE_PRO_PRICE_ID!,
    name:    "Pro",
    amount:  "€29 / month",
  },
}
