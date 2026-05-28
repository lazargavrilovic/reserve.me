import { getResend, FROM_EMAIL } from "./resend"
import { bookingConfirmationHtml, bookingConfirmationText } from "./templates/booking-confirmation"
import { generateIcs } from "@/lib/ical/generate"

export interface BookingEmailParams {
  appointmentId: string
  icalUid: string
  clientName: string
  clientEmail: string
  businessName: string
  businessSlug: string
  serviceName: string
  staffName: string
  startISO: string   // e.g. "2026-05-28T14:00:00"
  endISO: string
}

export async function sendBookingConfirmation(params: BookingEmailParams) {
  // Format the date/time for display
  const start = new Date(params.startISO)
  const end = new Date(params.endISO)

  const dateStr = start.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const startTime = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  const endTime = end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://reserve.me"
  const bookingUrl = `${appUrl}/${params.businessSlug}`

  // Generate .ics content
  const icsContent = generateIcs({
    uid: params.icalUid,
    summary: `${params.serviceName} at ${params.businessName}`,
    description: `Staff: ${params.staffName}\nBooked via reserve.me`,
    startISO: params.startISO,
    endISO: params.endISO,
    organiserEmail: FROM_EMAIL,
    organiserName: params.businessName,
  })

  const html = bookingConfirmationHtml({
    clientName: params.clientName,
    businessName: params.businessName,
    serviceName: params.serviceName,
    staffName: params.staffName,
    date: dateStr,
    startTime,
    endTime,
    bookingUrl,
  })

  const text = bookingConfirmationText({
    clientName: params.clientName,
    businessName: params.businessName,
    serviceName: params.serviceName,
    staffName: params.staffName,
    date: dateStr,
    startTime,
    endTime,
    bookingUrl,
  })

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: `${params.businessName} via reserve.me <${FROM_EMAIL}>`,
    to: params.clientEmail,
    subject: `Confirmed: ${params.serviceName} on ${dateStr}`,
    html,
    text,
    attachments: [
      {
        filename: "appointment.ics",
        content: Buffer.from(icsContent).toString("base64"),
      },
    ],
  })

  if (error) {
    console.error("[Email] Failed to send booking confirmation:", error)
  }
}
