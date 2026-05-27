"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarDays,
  Scissors,
  Users,
  Settings,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/dashboard/services", label: "Services", icon: Scissors },
  { href: "/dashboard/staff", label: "Staff", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
]

interface Props {
  business: { name: string; slug: string }
  userRole: string
}

export function DashboardNav({ business, userRole }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-60 border-r bg-card flex flex-col shrink-0">
      <div className="p-4 border-b">
        <p className="font-semibold text-sm truncate">{business.name}</p>
        <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard" ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t">
        <Link
          href={`/${business.slug}`}
          target="_blank"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View booking page
        </Link>
      </div>
    </aside>
  )
}
