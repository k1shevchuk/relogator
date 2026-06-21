import Link from "next/link"
import { LogIn } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AuthFormMessage,
  readAuthSearchParams,
} from "@/features/auth/auth-form-message"
import { signInAction } from "@/features/auth/actions"
import { SupabaseSetupNotice } from "@/features/auth/supabase-setup-notice"
import { isSupabaseConfigured } from "@/lib/supabase/server"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[]
    message?: string | string[]
    next?: string | string[]
  }>
}) {
  const { error, message, next } = await readAuthSearchParams(searchParams)
  const configured = isSupabaseConfigured()

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-8 sm:px-6">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>
              <h1 className="text-xl font-semibold">Вход в Relogator</h1>
            </CardTitle>
            <CardDescription>
              Войдите, чтобы сохранять анкеты, маршруты и заявки в своем
              аккаунте.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!configured && <SupabaseSetupNotice />}
            <AuthFormMessage error={error} message={message} />
            <form action={signInAction} className="flex flex-col gap-4">
              <input name="next" type="hidden" value={next} />
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" disabled={!configured}>
                <LogIn data-icon="inline-start" />
                Войти
              </Button>
            </form>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link
                className="underline-offset-4 hover:underline"
                href="/auth/reset-password"
              >
                Забыли пароль?
              </Link>
              <Link
                className="underline-offset-4 hover:underline"
                href={`/auth/register?${new URLSearchParams({ next })}`}
              >
                Создать аккаунт
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
