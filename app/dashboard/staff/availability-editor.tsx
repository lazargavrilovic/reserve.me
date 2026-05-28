"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { saveAvailability } from "./actions"
import type { AvailabilityRow, StaffProfileRow } from "@/types/database"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DEFAULT_START = "09:00"
const DEFAULT_END = "17:00"

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, "0")
  const m = i % 2 === 0 ? "00" : "30"
  return `${h}:${m}`
})

interface DaySlot {
  enabled: boolean
  start_time: string
  end_time: string
}

interface Props {
  open: boolean
  onClose: () => void
  staff: StaffProfileRow
  availability: AvailabilityRow[]
}

export function AvailabilityEditor({ open, onClose, staff, availability }: Props) {
  const [isPending, startTransition] = useTransition()

  // Build initial state from existing availability
  const [schedule, setSchedule] = useState<DaySlot[]>(() =>
    DAYS.map((_, dayIndex) => {
      const existing = availability.find((a) => a.day_of_week === dayIndex)
      return existing
        ? { enabled: true, start_time: existing.start_time.slice(0, 5), end_time: existing.end_time.slice(0, 5) }
        : { enabled: false, start_time: DEFAULT_START, end_time: DEFAULT_END }
    })
  )

  function toggleDay(day: number) {
    setSchedule((prev) =>
      prev.map((slot, i) => (i === day ? { ...slot, enabled: !slot.enabled } : slot))
    )
  }

  function updateTime(day: number, field: "start_time" | "end_time", value: string) {
    setSchedule((prev) =>
      prev.map((slot, i) => (i === day ? { ...slot, [field]: value } : slot))
    )
  }

  function handleSave() {
    const slots = schedule
      .map((slot, day) => ({
        day_of_week: day,
        start_time: slot.start_time,
        end_time: slot.end_time,
        enabled: slot.enabled,
      }))
      .filter((s) => s.enabled)
      .map(({ day_of_week, start_time, end_time }) => ({ day_of_week, start_time, end_time }))

    startTransition(async () => {
      await saveAvailability(staff.id, slots)
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Availability — {staff.display_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {DAYS.map((dayName, dayIndex) => {
            const slot = schedule[dayIndex]
            return (
              <div key={dayIndex} className="flex items-center gap-3">
                <label className="flex items-center gap-2 w-32 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={slot.enabled}
                    onChange={() => toggleDay(dayIndex)}
                    className="rounded border-gray-300"
                  />
                  <span className={`text-sm font-medium ${slot.enabled ? "" : "text-muted-foreground"}`}>
                    {dayName.slice(0, 3)}
                  </span>
                </label>

                {slot.enabled ? (
                  <div className="flex items-center gap-2 flex-1">
                    <select
                      value={slot.start_time}
                      onChange={(e) => updateTime(dayIndex, "start_time", e.target.value)}
                      className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <span className="text-muted-foreground text-sm">–</span>
                    <select
                      value={slot.end_time}
                      onChange={(e) => updateTime(dayIndex, "end_time", e.target.value)}
                      className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {TIME_OPTIONS.filter((t) => t > slot.start_time).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unavailable</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save schedule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
