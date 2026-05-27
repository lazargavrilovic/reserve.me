"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { slugify } from "@/lib/utils"

interface Props {
  userId: string
}

const TIMEZONES = Intl.supportedValuesOf("timeZone")

export function OnboardingForm({ userId }: Props) {
  const router = useRouter()
  const [businessName, setBusinessName] = useState("")
  const [slug, setSlug] = useState("")
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleNameChange(value: string) {
    setBusinessName(value)
    setSlug(slugify(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!slug) {
      setError("Business name is required.")
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Create the business
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .insert({ name: businessName, slug, timezone })
      .select("id")
      .single()

    if (bizError) {
      setError(
        bizError.code === "23505"
          ? "That URL slug is already taken. Try a different business name."
          : bizError.message
      )
      setLoading(false)
      return
    }

    // Add owner membership
    const { error: memberError } = await supabase
      .from("business_members")
      .insert({ business_id: business.id, user_id: userId, role: "owner" })

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    // Create a staff profile for the owner so they appear as staff by default
    await supabase.from("staff_profiles").insert({
      business_id: business.id,
      user_id: userId,
      display_name: businessName,
    })

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="business-name">Business name</Label>
            <Input
              id="business-name"
              placeholder="Sarah&apos;s Nail Studio"
              value={businessName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Your booking URL</Label>
            <div className="flex items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground select-none">reserve.me/</span>
              <input
                id="slug"
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
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating your business…" : "Continue to dashboard"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
