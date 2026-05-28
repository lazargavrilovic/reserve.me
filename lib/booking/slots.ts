/**
 * Slot generation engine.
 * Given a staff member's working window and their existing appointments,
 * returns an array of available start times (HH:mm) for a given date.
 */

const SLOT_INTERVAL = 30 // minutes between slot start times

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0")
  const m = (minutes % 60).toString().padStart(2, "0")
  return `${h}:${m}`
}

export interface AvailableSlot {
  start: string // "09:00"
  end: string   // "09:45"
}

export function generateAvailableSlots({
  availStart,     // "09:00"
  availEnd,       // "17:00"
  durationMinutes,
  bookedSlots,    // existing appointments for that day
  date,           // "YYYY-MM-DD" — used to filter out past times
}: {
  availStart: string
  availEnd: string
  durationMinutes: number
  bookedSlots: { start_time: string; end_time: string }[]
  date: string
}): AvailableSlot[] {
  const windowStart = timeToMinutes(availStart)
  const windowEnd = timeToMinutes(availEnd)
  const slots: AvailableSlot[] = []

  // Build a "now" cutoff in local minutes (for today only)
  const now = new Date()
  const todayStr = now.toISOString().split("T")[0]
  const nowMinutes =
    date === todayStr
      ? now.getHours() * 60 + now.getMinutes() + 60 // buffer: 1h from now
      : 0

  let cursor = windowStart
  while (cursor + durationMinutes <= windowEnd) {
    const slotEnd = cursor + durationMinutes

    // Skip slots in the past
    if (cursor >= nowMinutes) {
      // Check for overlap with any booked slot
      const overlaps = bookedSlots.some((booked) => {
        const bStart = timeToMinutes(booked.start_time.slice(0, 5))
        const bEnd = timeToMinutes(booked.end_time.slice(0, 5))
        // Overlap if slot starts before booked ends AND slot ends after booked starts
        return cursor < bEnd && slotEnd > bStart
      })

      if (!overlaps) {
        slots.push({
          start: minutesToTime(cursor),
          end: minutesToTime(slotEnd),
        })
      }
    }

    cursor += SLOT_INTERVAL
  }

  return slots
}
