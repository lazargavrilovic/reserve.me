export interface BookingConfirmationData {
  clientName: string
  businessName: string
  serviceName: string
  staffName: string
  date: string        // "Wednesday, May 28, 2026"
  startTime: string   // "14:00"
  endTime: string     // "14:45"
  bookingUrl: string  // full URL to the business booking page
}

export function bookingConfirmationHtml(d: BookingConfirmationData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:28px 32px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">reserve.me</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">You&apos;re booked! ✓</p>
              <p style="margin:0 0 24px;color:#71717a;font-size:15px;">Hi ${d.clientName}, your appointment at <strong style="color:#18181b;">${d.businessName}</strong> is confirmed.</p>

              <!-- Appointment details card -->
              <table width="100%" style="background:#f4f4f5;border-radius:8px;padding:20px;margin-bottom:24px;" cellpadding="0" cellspacing="0">
                <tr><td style="padding:4px 0;">
                  <span style="color:#71717a;font-size:13px;display:block;">Service</span>
                  <span style="color:#18181b;font-size:15px;font-weight:600;">${d.serviceName}</span>
                </td></tr>
                <tr><td style="padding:4px 0;">
                  <span style="color:#71717a;font-size:13px;display:block;">With</span>
                  <span style="color:#18181b;font-size:15px;font-weight:600;">${d.staffName}</span>
                </td></tr>
                <tr><td style="padding:4px 0;">
                  <span style="color:#71717a;font-size:13px;display:block;">Date</span>
                  <span style="color:#18181b;font-size:15px;font-weight:600;">${d.date}</span>
                </td></tr>
                <tr><td style="padding:4px 0;">
                  <span style="color:#71717a;font-size:13px;display:block;">Time</span>
                  <span style="color:#18181b;font-size:15px;font-weight:600;">${d.startTime} – ${d.endTime}</span>
                </td></tr>
              </table>

              <p style="margin:0 0 16px;color:#71717a;font-size:14px;">
                The <strong>.ics calendar file</strong> is attached — double-click it to add this appointment to your calendar app.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#18181b;border-radius:8px;padding:12px 24px;">
                    <a href="${d.bookingUrl}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
                      View booking page →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#a1a1aa;font-size:13px;">
                Need to cancel or reschedule? Contact ${d.businessName} directly.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                Sent by <a href="https://reserve.me" style="color:#71717a;">reserve.me</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function bookingConfirmationText(d: BookingConfirmationData): string {
  return `Hi ${d.clientName},

Your appointment at ${d.businessName} is confirmed!

Service: ${d.serviceName}
With: ${d.staffName}
Date: ${d.date}
Time: ${d.startTime} – ${d.endTime}

A .ics calendar file is attached — open it to add this to your calendar.

Need to cancel? Contact ${d.businessName} directly.

— reserve.me`
}
