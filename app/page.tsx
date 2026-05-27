import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container flex items-center justify-between h-16">
          <span className="text-xl font-bold tracking-tight">reserve.me</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started free</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center text-center px-4 py-24">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-5xl font-bold tracking-tight leading-tight">
            Online booking for<br />any service business
          </h1>
          <p className="text-lg text-muted-foreground">
            Let clients book appointments 24/7. No downloads, no accounts needed.
            Set up your page in minutes.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">Start free trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo">See a demo</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            No credit card required. Free 14-day trial.
          </p>
        </div>
      </section>
    </main>
  )
}
