/** Format a JS ISO string into iCal UTC timestamp (e.g. 20250601T140000Z) */
function fmtDt(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

/** Escape special characters in iCal text values */
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,")
}

/**
 * Generates an .ics file for a single appointment (used as email attachment).
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
  const now = fmtDt(new Date().toISOString())

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//reserve.me//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@reserve.me`,
    `DTSTAMP:${now}`,
    `DTSTART:${fmtDt(startISO)}`,
    `DTEND:${fmtDt(endISO)}`,
    `SUMMARY:${esc(summary)}`,
    `DESCRIPTION:${esc(description).replace(/\n/g, "\\n")}`,
    `ORGANIZER;CN=${esc(organiserName)}:mailto:${organiserEmail}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}

export interface FeedEvent {
  uid: string
  summary: string
  description: string
  startISO: string
  endISO: string
  status?: "CONFIRMED" | "CANCELLED"
}

/**
 * Generates a full .ics calendar feed with multiple events.
 * Used for the per-staff subscription URL.
 */
export function generateCalendarFeed(calendarName: string, events: FeedEvent[]): string {
  const now = fmtDt(new Date().toISOString())

  const vevents = events.flatMap((e) => [
    "BEGIN:VEVENT",
    `UID:${e.uid}@reserve.me`,
    `DTSTAMP:${now}`,
    `DTSTART:${fmtDt(e.startISO)}`,
    `DTEND:${fmtDt(e.endISO)}`,
    `SUMMARY:${esc(e.summary)}`,
    `DESCRIPTION:${esc(e.description).replace(/\n/g, "\\n")}`,
    `STATUS:${e.status ?? "CONFIRMED"}`,
    "END:VEVENT",
  ])

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//reserve.me//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(calendarName)}`,
    "X-WR-TIMEZONE:UTC",
    ...vevents,
    "END:VCALENDAR",
  ].join("\r\n")
}
