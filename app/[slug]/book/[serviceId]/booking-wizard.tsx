"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { createAppointment } from "./actions"
import { formatDuration, formatPrice } from "@/lib/utils"
import { ChevronLeft, CalendarPlus, Download, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import type { ServiceRow, StaffProfileRow } from "@/types/database"

interface Props {
  business: { id: string; name: string; slug: string; timezone: string }
  service: ServiceRow
  staffList: StaffProfileRow[]
}

interface Slot { start: string; end: string }

// Generate next N days as YYYY-MM-DD
function getNextDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split("T")[0]
  })
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short" }),
    num: d.getDate(),
    month: d.toLocaleDateString("en-US", { month: "short" }),
  }
}

function buildGoogleCalendarUrl(params: {
  title: string; start: string; end: string; description: string
}) {
  const fmt = (iso: string) => iso.replace(/[-:]/g, "").replace(".000Z", "Z")
  const url = new URL("https://calendar.google.com/calendar/render")
  url.searchParams.set("action", "TEMPLATE")
  url.searchParams.set("text", params.title)
  url.searchParams.set("dates", `${fmt(params.start)}/${fmt(params.end)}`)
  url.searchParams.set("details", params.description)
  return url.toString()
}

export function BookingWizard({ business, service, staffList }: Props) {
  const days = getNextDays(30)
  const [selectedStaff, setSelectedStaff] = useState<StaffProfileRow | null>(
    staffList.length === 1 ? staffList[0] : null
  )
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Client details
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [notes, setNotes] = useState("")

  // Booking state
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<{ appointmentId: string; startISO: string; endISO: string } | null>(null)

  // Fetch slots when date or staff changes
  useEffect(() => {
    if (!selectedDate || !selectedStaff) return
    setSlots([])
    setSelectedSlot(null)
    setLoadingSlots(true)

    fetch(`/api/slots?staffId=${selectedStaff.id}&serviceId=${service.id}&date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, selectedStaff, service.id])

  function handleBook() {
    if (!selectedStaff || !selectedDate || !selectedSlot) return
    if (!clientName || !clientEmail) {
      setError("Name and email are required.")
      return
    }
    setError(null)

    startTransition(async () => {
      const result = await createAppointment({
        businessId: business.id,
        serviceId: service.id,
        staffId: selectedStaff.id,
        date: selectedDate,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        clientName,
        clientEmail,
        clientPhone,
        notes,
        timezone: business.timezone,
      })

      if (result.success && result.appointmentId) {
        setConfirmed({
          appointmentId: result.appointmentId,
          startISO: `${selectedDate}T${selectedSlot.start}:00`,
          endISO: `${selectedDate}T${selectedSlot.end}:00`,
        })
      } else {
        setError(result.error ?? "Something went wrong.")
      }
    })
  }

  // ── Confirmation screen ──────────────────────────────────────────────────
  if (confirmed) {
    const gcalUrl = buildGoogleCalendarUrl({
      title: `${service.name} at ${business.name}`,
      start: confirmed.startISO,
      end: confirmed.endISO,
      description: `Booked via reserve.me/${business.slug}`,
    })
    const icsUrl = `/api/ical/appointment/${confirmed.appointmentId}`

    return (
      <div className="text-center space-y-6 py-8">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold">You&apos;re booked!</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            A confirmation has been sent to <strong>{clientEmail}</strong>
          </p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 text-sm text-left max-w-xs mx-auto space-y-1">
          <p><span className="font-medium">Service:</span> {service.name}</p>
          <p><span className="font-medium">Staff:</span> {selectedStaff?.display_name}</p>
          <p><span className="font-medium">Date:</span> {selectedDate}</p>
          <p><span className="font-medium">Time:</span> {selectedSlot?.start} – {selectedSlot?.end}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <a href={gcalUrl} target="_blank" rel="noopener noreferrer">
              <CalendarPlus className="w-4 h-4 mr-2" />
              Add to Google Calendar
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={icsUrl} download>
              <Download className="w-4 h-4 mr-2" />
              Download .ics
            </a>
          </Button>
        </div>
        <Link href={`/${business.slug}`} className="text-sm text-muted-foreground hover:underline block">
          ← Back to {business.name}
        </Link>
      </div>
    )
  }

  // ── Booking form ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Back + service info */}
      <div>
        <Link
          href={`/${business.slug}`}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold">{service.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {formatDuration(service.duration_minutes)} · {formatPrice(service.price_cents, service.currency)}
        </p>
      </div>

      {/* Staff selector (only if multiple) */}
      {staffList.length > 1 && (
        <div>
          <p className="text-sm font-medium mb-2">Select staff member</p>
          <div className="flex gap-2 flex-wrap">
            {staffList.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStaff(s)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  selectedStaff?.id === s.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {s.display_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date strip */}
      {selectedStaff && (
        <div>
          <p className="text-sm font-medium mb-2">Select date</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {days.map((dateStr) => {
              const { day, num, month } = formatDateLabel(dateStr)
              const isSelected = selectedDate === dateStr
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex flex-col items-center min-w-[56px] rounded-xl border py-2 px-1 text-xs transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  <span className="font-medium">{day}</span>
                  <span className="text-base font-bold leading-tight">{num}</span>
                  <span className="opacity-70">{month}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Time slots */}
      {selectedDate && (
        <div>
          <p className="text-sm font-medium mb-2">Select time</p>
          {loadingSlots ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading slots…
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No availability on this day.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  onClick={() => setSelectedSlot(slot)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    selectedSlot?.start === slot.start
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  {slot.start}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Client details */}
      {selectedSlot && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <p className="font-medium text-sm">Your details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="client-name">Full name *</Label>
                <Input
                  id="client-name"
                  placeholder="Jane Smith"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-phone">Phone</Label>
                <Input
                  id="client-phone"
                  placeholder="+1 555 000 0000"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-email">Email *</Label>
              <Input
                id="client-email"
                type="email"
                placeholder="jane@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-notes">Notes (optional)</Label>
              <Input
                id="client-notes"
                placeholder="Anything we should know?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              className="w-full"
              size="lg"
              onClick={handleBook}
              disabled={isPending}
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirming…</>
              ) : (
                `Confirm booking · ${selectedSlot.start}`
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              No account needed. Free cancellation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
