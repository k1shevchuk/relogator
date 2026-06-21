import Link from "next/link"
import { Compass } from "lucide-react"

import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="border-b bg-background/95">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 font-heading text-lg font-semibold"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Compass />
          </span>
          <span>Relogator</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/results">Результаты</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/questionnaire">Начать подбор</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
