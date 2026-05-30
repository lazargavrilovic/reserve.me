"use client"

import { useFormState, useFormStatus } from "react-dom"
import { updateBusinessSettings } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BusinessRow } from "@/types/database"

const TIMEZONES = [
  "UTC",
  "Europe/Belgrade",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Vienna",
  "Europe/Warsaw",
  "Europe/Budapest",
  "Europe/Bucharest",
  "Europe/Athens",
  "Europe/Istanbul",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
]

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  )
}

interface Props {
  business: BusinessRow
}

export function SettingsClient({ business }: Props) {
  const [state, action] = useFormState(updateBusinessSettings, { error: null, success: false })

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your business profile and booking page
        </p>
      </div>

      <form action={action} className="space-y-6">
        {/* Business name */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Business profile</h2>

          <div className="space-y-2">
            <Label htmlFor="name">Business name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={business.name}
              placeholder="e.g. Frizer Cutic"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              defaultValue={business.description ?? ""}
              placeholder="Short description shown on your booking page"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>

        {/* Booking page URL */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <h2 className="font-semibold">Booking page URL</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Changing this will break any existing links you&apos;ve shared.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">reserve-me.netlify.app/</span>
              <Input
                id="slug"
                name="slug"
                defaultValue={business.slug}
                placeholder="your-business"
                className="max-w-[200px]"
              />
            </div>
          </div>
        </div>

        {/* Timezone */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <h2 className="font-semibold">Timezone</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Used to display appointment times correctly.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              name="timezone"
              defaultValue={business.timezone}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status + submit */}
        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state.success && (
          <p className="text-sm text-emerald-600">Settings saved successfully.</p>
        )}

        <SaveButton />
      </form>
    </div>
  )
}
