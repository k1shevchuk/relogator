import { KeyRound } from "lucide-react"

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
import { updatePasswordAction } from "@/features/auth/actions"
import { SupabaseSetupNotice } from "@/features/auth/supabase-setup-notice"
import { isSupabaseConfigured } from "@/lib/supabase/server"

export default async function NewPasswordPage({
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
              <h1 className="text-xl font-semibold">Новый пароль</h1>
            </CardTitle>
            <CardDescription>
              Эта страница работает после перехода по письму сброса пароля.
              Введите новый пароль для аккаунта.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!configured && <SupabaseSetupNotice />}
            <AuthFormMessage error={error} message={message} />
            <form action={updatePasswordAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Новый пароль</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Повторите пароль</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" disabled={!configured}>
                <KeyRound data-icon="inline-start" />
                Обновить пароль
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
