import { google } from "googleapis"

export interface GoogleTokens {
  access_token?: string | null
  refresh_token?: string | null
  expiry_date?: number | null
  token_type?: string | null
  scope?: string
  id_token?: string | null
}

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  )
}

/** Generate the Google OAuth consent URL. staffId is passed as `state` so we
 *  know which staff profile to update after the user approves. */
export function getGoogleAuthUrl(staffId: string): string {
  const client = getOAuthClient()
  return client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    state: staffId,
    prompt: "consent", // Always ask so we always get a refresh_token
  })
}

/** Exchange the OAuth authorisation code for access + refresh tokens. */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const client = getOAuthClient()
  const { tokens } = await client.getToken(code)
  return tokens as GoogleTokens
}

export interface CalendarEventInput {
  summary: string
  description: string
  startISO: string
  endISO: string
}

/** Create a Google Calendar event on the connected staff member's primary
 *  calendar. Returns the new event ID, or null on failure. */
export async function createCalendarEvent(
  tokens: GoogleTokens,
  event: CalendarEventInput
): Promise<string | null> {
  try {
    const client = getOAuthClient()
    client.setCredentials(tokens)
    const calendar = google.calendar({ version: "v3", auth: client })

    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.startISO },
        end: { dateTime: event.endISO },
      },
    })

    return res.data.id ?? null
  } catch (err) {
    console.error("[Google Calendar] createEvent error:", err)
    return null
  }
}

/** Delete a Google Calendar event. Fails silently — a missing event is not
 *  an error (may have been manually deleted). */
export async function deleteCalendarEvent(
  tokens: GoogleTokens,
  eventId: string
): Promise<void> {
  try {
    const client = getOAuthClient()
    client.setCredentials(tokens)
    const calendar = google.calendar({ version: "v3", auth: client })

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    })
  } catch (err) {
    console.error("[Google Calendar] deleteEvent error:", err)
  }
}
