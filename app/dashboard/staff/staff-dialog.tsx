"use client"

import { useEffect, useRef } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { createStaff, updateStaff } from "./actions"
import type { StaffProfileRow } from "@/types/database"

interface Props {
  open: boolean
  onClose: () => void
  staff?: StaffProfileRow | null
}

const initial = { error: null as string | null }

export function StaffDialog({ open, onClose, staff }: Props) {
  const isEdit = !!staff
  const [createState, createAction] = useFormState(createStaff, initial)
  const [updateState, updateAction] = useFormState(updateStaff, initial)

  const state = isEdit ? updateState : createState
  const action = isEdit ? updateAction : createAction

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
          <DialogTitle>{isEdit ? "Edit staff member" : "Add staff member"}</DialogTitle>
        </DialogHeader>

        <form action={action} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={staff.id} />}

          <div className="space-y-2">
            <Label htmlFor="staff-name">Display name *</Label>
            <Input
              id="staff-name"
              name="display_name"
              placeholder="e.g. Ana"
              defaultValue={staff?.display_name ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-bio">Bio</Label>
            <Input
              id="staff-bio"
              name="bio"
              placeholder="Short description (optional)"
              defaultValue={staff?.bio ?? ""}
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <SubmitButton label={isEdit ? "Save changes" : "Add staff member"} />
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
