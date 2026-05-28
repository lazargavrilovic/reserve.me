import { Resend } from "resend"

// Lazily instantiated so missing key doesn't crash the app at import time
let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set")
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "noreply@reserve.me"
