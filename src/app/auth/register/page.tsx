import Link from "next/link"
import { UserPlus } from "lucide-react"

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
import { signUpAction } from "@/features/auth/actions"
import { SupabaseSetupNotice } from "@/features/auth/supabase-setup-notice"
import { isSupabaseConfigured } from "@/lib/supabase/server"

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[]
    message?: string | string[]
  }>
}) {
  const { error, message } = await readAuthSearchParams(searchParams)
  const configured = isSupabaseConfigured()

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-8 sm:px-6">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>
              <h1 className="text-xl font-semibold">Регистрация</h1>
            </CardTitle>
            <CardDescription>
              Создайте аккаунт по email и паролю. Supabase отправит письмо для
              подтверждения адреса.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!configured && <SupabaseSetupNotice />}
            <AuthFormMessage error={error} message={message} />
            <form action={signUpAction} className="flex flex-col gap-4">
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
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" disabled={!configured}>
                <UserPlus data-icon="inline-start" />
                Зарегистрироваться
              </Button>
            </form>
            <p className="text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link
                className="underline-offset-4 hover:underline"
                href="/auth/login"
              >
                Войти
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
