"use client"

import { useState } from "react"
import { Pencil, Trash2, Plus, Clock } from "lucide-react"
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

export function StaffClient({ staff }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [availOpen, setAvailOpen] = useState(false)
  const [editing, setEditing] = useState<StaffProfileRow | null>(null)
  const [availStaff, setAvailStaff] = useState<StaffWithAvailability | null>(null)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(member: StaffProfileRow) {
    setEditing(member)
    setDialogOpen(true)
  }

  function openAvailability(member: StaffWithAvailability) {
    setAvailStaff(member)
    setAvailOpen(true)
  }

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
          {staff.map((member) => {
            const activeDays = member.availability
              .map((a) => DAY_ABBR[a.day_of_week])
              .join(", ")

            return (
              <div key={member.id} className="rounded-lg border bg-card p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{member.display_name}</p>
                    {member.bio && (
                      <p className="text-sm text-muted-foreground mt-0.5">{member.bio}</p>
                    )}
                  </div>
                </div>

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

                <div className="flex items-center gap-1 pt-1 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => openAvailability(member)}
                  >
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    Set hours
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(member)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Remove "${member.display_name}"?`)) {
                        deleteStaff(member.id)
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <StaffDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        staff={editing}
      />

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
