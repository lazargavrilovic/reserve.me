/**
 * Generates an .ics file content string for a single appointment.
 */
export function generateIcs({
  uid,
  summary,
  description,
  startISO,
  endISO,
  organiserEmail,
  organiserName,
}: {
  uid: string
  summary: string
  description: string
  startISO: string
  endISO: string
  organiserEmail: string
  organiserName: string
}): string {
  const fmt = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//reserve.me//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@reserve.me`,
    `DTSTAMP:${now}`,
    `DTSTART:${fmt(startISO)}`,
    `DTEND:${fmt(endISO)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `ORGANIZER;CN=${organiserName}:mailto:${organiserEmail}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}
