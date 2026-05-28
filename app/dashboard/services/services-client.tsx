"use client"

import { useState } from "react"
import { Pencil, Trash2, Plus, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ServiceDialog } from "./service-dialog"
import { deleteService, toggleServiceStatus } from "./actions"
import { formatPrice, formatDuration } from "@/lib/utils"
import type { ServiceRow } from "@/types/database"

interface Props {
  services: ServiceRow[]
}

export function ServicesClient({ services }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceRow | null>(null)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(service: ServiceRow) {
    setEditing(service)
    setDialogOpen(true)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the services clients can book
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add service
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center mt-6">
          <p className="text-muted-foreground text-sm">No services yet.</p>
          <Button onClick={openCreate} variant="outline" className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Create your first service
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border mt-6 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Service</th>
                <th className="text-left px-4 py-3 font-medium">Duration</th>
                <th className="text-left px-4 py-3 font-medium">Price</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{service.name}</p>
                    {service.description && (
                      <p className="text-muted-foreground text-xs mt-0.5">{service.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDuration(service.duration_minutes)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatPrice(service.price_cents, service.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={service.is_active ? "success" : "secondary"}>
                      {service.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={service.is_active ? "Deactivate" : "Activate"}
                        onClick={() => toggleServiceStatus(service.id, !service.is_active)}
                      >
                        {service.is_active
                          ? <ToggleRight className="w-4 h-4 text-emerald-600" />
                          : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit"
                        onClick={() => openEdit(service)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        onClick={() => {
                          if (confirm(`Delete "${service.name}"?`)) {
                            deleteService(service.id)
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ServiceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        service={editing}
      />
    </>
  )
}
