"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Pencil, Trash2, Plus, Clock, Link2, Check, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StaffDialog } from "./staff-dialog"
import { AvailabilityEditor } from "./availability-editor"
import { deleteStaff } from "./actions"
import type { StaffProfileRow, AvailabilityRow } from "@/types/database"

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface StaffWithAvailability extends StaffProfileRow {
  availability: AvailabilityRow[]
}

interface Props {
  staff: StaffWithAvailability[]
}

// ── iCal copy button ──────────────────────────────────────────────────────────

function CopyIcalButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const url = `${window.location.origin}/api/ical/staff/${token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex-1 text-xs"
      onClick={handleCopy}
      title="Copy iCal subscription URL"
    >
      {copied ? (
        <><Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />Copied!</>
      ) : (
        <><Link2 className="w-3.5 h-3.5 mr-1.5" />iCal link</>
      )}
    </Button>
  )
}

// ── Google Calendar connect button ────────────────────────────────────────────

function ConnectGoogleButton({ staffId, connected }: { staffId: string; connected: boolean }) {
  if (connected) {
    return (
      <Button variant="ghost" size="sm" className="flex-1 text-xs text-emerald-600" disabled>
        <Check className="w-3.5 h-3.5 mr-1.5" />
        Google linked
      </Button>
    )
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex-1 text-xs"
      onClick={() => { window.location.href = `/api/auth/google?staffId=${staffId}` }}
      title="Connect Google Calendar — appointments will sync automatically"
    >
      <Calendar className="w-3.5 h-3.5 mr-1.5" />
      Connect Google
    </Button>
  )
}

// ── Success / error banner (reads ?gcal= URL param) ───────────────────────────

function GCalBanner() {
  const params = useSearchParams()
  const gcal = params.get("gcal")
  if (!gcal) return null

  return (
    <div className={`rounded-md px-4 py-3 text-sm font-medium ${
      gcal === "connected"
        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
        : "bg-red-50 text-red-700 border border-red-200"
    }`}>
      {gcal === "connected"
        ? "✓ Google Calendar connected — appointments will now sync automatically."
        : "✗ Failed to connect Google Calendar. Please try again."}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function StaffClient({ staff }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [availOpen,  setAvailOpen]  = useState(false)
  const [editing,    setEditing]    = useState<StaffProfileRow | null>(null)
  const [availStaff, setAvailStaff] = useState<StaffWithAvailability | null>(null)

  function openCreate() { setEditing(null); setDialogOpen(true) }
  function openEdit(m: StaffProfileRow) { setEditing(m); setDialogOpen(true) }
  function openAvailability(m: StaffWithAvailability) { setAvailStaff(m); setAvailOpen(true) }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your team and their availability
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add staff member
        </Button>
      </div>

      {/* Google Calendar connection notification */}
      <Suspense fallback={null}>
        <GCalBanner />
      </Suspense>

      {staff.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center mt-6">
          <p className="text-muted-foreground text-sm">No staff members yet.</p>
          <Button onClick={openCreate} variant="outline" className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Add your first staff member
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {staff.map((member) => (
            <div key={member.id} className="rounded-lg border bg-card p-5 space-y-3">
              <div>
                <p className="font-semibold">{member.display_name}</p>
                {member.bio && (
                  <p className="text-sm text-muted-foreground mt-0.5">{member.bio}</p>
                )}
              </div>

              {/* Availability day badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {member.availability.length > 0 ? (
                  member.availability
                    .sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((a) => (
                      <Badge key={a.id} variant="secondary" className="text-xs">
                        {DAY_ABBR[a.day_of_week]}
                      </Badge>
                    ))
                ) : (
                  <span className="text-xs text-muted-foreground">No availability set</span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-1 pt-1 border-t">
                {/* Row 1: Set hours + iCal link */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => openAvailability(member)}
                  >
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    Set hours
                  </Button>
                  {member.ical_feed_url && (
                    <CopyIcalButton token={member.ical_feed_url} />
                  )}
                </div>

                {/* Row 2: Google Calendar + edit + delete */}
                <div className="flex items-center gap-1">
                  <ConnectGoogleButton
                    staffId={member.id}
                    connected={!!member.google_calendar_token}
                  />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(member)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Remove "${member.display_name}"?`)) deleteStaff(member.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <StaffDialog open={dialogOpen} onClose={() => setDialogOpen(false)} staff={editing} />

      {availStaff && (
        <AvailabilityEditor
          open={availOpen}
          onClose={() => setAvailOpen(false)}
          staff={availStaff}
          availability={availStaff.availability}
        />
      )}
    </>
  )
}
