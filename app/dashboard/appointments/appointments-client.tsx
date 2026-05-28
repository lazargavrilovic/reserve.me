"use client"

import { useState, useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { updateAppointmentStatus } from "./actions"
import { CheckCircle2, XCircle, UserX, ChevronDown } from "lucide-react"
import type { AppointmentStatus } from "@/types/database"

type Filter = "upcoming" | "today" | "past" | "all"

interface Appointment {
  id: string
  client_name: string
  client_email: string
  client_phone: string | null
  start_time: string
  end_time: string
  status: AppointmentStatus
  notes: string | null
  service_name: string
  staff_name: string
}

interface Props {
  appointments: Appointment[]
}

const STATUS_BADGE: Record<AppointmentStatus, { label: string; variant: "success" | "secondary" | "destructive" | "warning" | "outline" }> = {
  confirmed:  { label: "Confirmed",  variant: "success" },
  completed:  { label: "Completed",  variant: "secondary" },
  cancelled:  { label: "Cancelled",  variant: "destructive" },
  no_show:    { label: "No-show",    variant: "warning" },
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  }
}

export function AppointmentsClient({ appointments }: Props) {
  const [filter, setFilter] = useState<Filter>("upcoming")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 86400000)

  const filtered = appointments.filter((a) => {
    const t = new Date(a.start_time)
    if (filter === "today")    return t >= todayStart && t < todayEnd
    if (filter === "upcoming") return t >= now && a.status !== "cancelled"
    if (filter === "past")     return t < now || a.status === "completed" || a.status === "no_show"
    return true
  })

  function handleStatus(id: string, status: AppointmentStatus) {
    startTransition(() => updateAppointmentStatus(id, status))
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "today",    label: "Today" },
    { key: "past",     label: "Past" },
    { key: "all",      label: "All" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {appointments.filter(a => new Date(a.start_time) >= now && a.status === "confirmed").length} upcoming confirmed
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              filter === key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No appointments found.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((appt) => {
            const { date, time } = formatDateTime(appt.start_time)
            const { time: endTime } = formatDateTime(appt.end_time)
            const { label, variant } = STATUS_BADGE[appt.status]
            const isExpanded = expanded === appt.id
            const isPast = new Date(appt.start_time) < now

            return (
              <div key={appt.id} className="rounded-lg border bg-card overflow-hidden">
                {/* Main row */}
                <div
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : appt.id)}
                >
                  {/* Date/time */}
                  <div className="w-28 shrink-0">
                    <p className="text-xs text-muted-foreground">{date}</p>
                    <p className="font-semibold text-sm">{time} – {endTime}</p>
                  </div>

                  {/* Client + service */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{appt.client_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {appt.service_name} · {appt.staff_name}
                    </p>
                  </div>

                  <Badge variant={variant}>{label}</Badge>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t bg-muted/20 space-y-3">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">Email</span>
                        <p>{appt.client_email}</p>
                      </div>
                      {appt.client_phone && (
                        <div>
                          <span className="text-muted-foreground text-xs">Phone</span>
                          <p>{appt.client_phone}</p>
                        </div>
                      )}
                      {appt.notes && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground text-xs">Notes</span>
                          <p>{appt.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {appt.status === "confirmed" && (
                      <div className="flex gap-2 pt-1">
                        {isPast && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => handleStatus(appt.id, "completed")}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                            Mark completed
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleStatus(appt.id, "no_show")}
                        >
                          <UserX className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                          No-show
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => {
                            if (confirm("Cancel this appointment?")) {
                              handleStatus(appt.id, "cancelled")
                            }
                          }}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1.5 text-destructive" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
