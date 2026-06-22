import Link from "next/link"
import { Compass, Route } from "lucide-react"

import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 font-heading text-lg font-semibold"
        >
          <span className="flex size-9 items-center justify-center rounded-md bg-foreground text-background shadow-sm">
            <Compass className="size-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span>Relogator</span>
            <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
              навигатор переезда
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="px-2">
            <Link href="/results">Результаты</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="px-2">
            <Link href="/account">Кабинет</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="px-2">
            <Link href="/auth">Войти</Link>
          </Button>
          <Button asChild size="sm" className="px-2 sm:px-3">
            <Link href="/questionnaire">
              <Route data-icon="inline-start" />
              Начать подбор
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
