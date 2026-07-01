import Link from "next/link"
import { connection } from "next/server"
import { Compass, LogOut, Route } from "lucide-react"

import { Button } from "@/components/ui/button"
import { signOutAction } from "@/features/auth/actions"
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server"

export async function SiteHeader() {
  await connection()

  const isSignedIn = await getIsSignedIn()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 font-heading text-lg font-semibold"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-foreground text-background shadow-sm">
            <Compass className="size-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span>Relogator</span>
            <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
              навигатор переезда
            </span>
          </span>
        </Link>
        <nav className="flex w-full flex-wrap items-center justify-start gap-1 sm:w-auto sm:justify-end sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="px-2">
            <Link href="/results">Результаты</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden px-2 md:inline-flex"
          >
            <Link href="/partners">Партнерам</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="px-2">
            <Link href="/account">Кабинет</Link>
          </Button>
          {isSignedIn ? (
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="px-2"
              >
                <LogOut data-icon="inline-start" />
                Выйти
              </Button>
            </form>
          ) : (
            <Button asChild variant="outline" size="sm" className="px-2">
              <Link href="/auth">Войти</Link>
            </Button>
          )}
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

async function getIsSignedIn() {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return Boolean(user)
  } catch {
    return false
  }
}
