"use client"

import { useEffect, useRef, useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { createService, updateService } from "./actions"
import type { ServiceRow } from "@/types/database"

interface Props {
  open: boolean
  onClose: () => void
  service?: ServiceRow | null  // null = create mode
}

const createInitial = { error: null as string | null }
const updateInitial = { error: null as string | null }

export function ServiceDialog({ open, onClose, service }: Props) {
  const isEdit = !!service
  const [createState, createAction] = useFormState(createService, createInitial)
  const [updateState, updateAction] = useFormState(updateService, updateInitial)

  const state = isEdit ? updateState : createState
  const action = isEdit ? updateAction : createAction

  // Close dialog on successful submit
  const prevError = useRef(state.error)
  useEffect(() => {
    if (prevError.current !== state.error && state.error === null && open) {
      onClose()
    }
    prevError.current = state.error
  }, [state.error, open, onClose])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit service" : "New service"}</DialogTitle>
        </DialogHeader>

        <form action={action} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={service.id} />}

          <div className="space-y-2">
            <Label htmlFor="svc-name">Service name *</Label>
            <Input
              id="svc-name"
              name="name"
              placeholder="e.g. Haircut"
              defaultValue={service?.name ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="svc-desc">Description</Label>
            <Input
              id="svc-desc"
              name="description"
              placeholder="Optional description"
              defaultValue={service?.description ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="svc-duration">Duration (minutes) *</Label>
              <Input
                id="svc-duration"
                name="duration"
                type="number"
                min={5}
                step={5}
                placeholder="30"
                defaultValue={service?.duration_minutes ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-price">Price (€) *</Label>
              <Input
                id="svc-price"
                name="price"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                defaultValue={service ? (service.price_cents / 100).toFixed(2) : ""}
                required
              />
            </div>
          </div>

          <input type="hidden" name="currency" value="EUR" />

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <SubmitButton label={isEdit ? "Save changes" : "Create service"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  )
}
