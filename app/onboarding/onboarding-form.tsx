"use client"

import { useFormState, useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { createBusiness } from "./actions"
import { slugify } from "@/lib/utils"
import { useState } from "react"

const TIMEZONES = Intl.supportedValuesOf("timeZone")

const initialState = { error: null as string | null }

export function OnboardingForm() {
  const [state, formAction] = useFormState(createBusiness, initialState)
  const [slug, setSlug] = useState("")

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="business-name">Business name</Label>
            <Input
              id="business-name"
              name="businessName"
              placeholder="Sarah's Nail Studio"
              onChange={(e) => setSlug(slugify(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Your booking URL</Label>
            <div className="flex items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground select-none">reserve.me/</span>
              <input
                id="slug"
                name="slug"
                className="flex-1 bg-transparent outline-none ml-0.5 font-medium"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                required
                placeholder="sarahs-nail-studio"
              />
            </div>
            <p className="text-xs text-muted-foreground">Lowercase letters, numbers and hyphens only</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              name="timezone"
              defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating your business…" : "Continue to dashboard"}
    </Button>
  )
}
