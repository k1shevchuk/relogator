import Link from "next/link"
import { Mail } from "lucide-react"

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
import { requestPasswordResetAction } from "@/features/auth/actions"
import { SupabaseSetupNotice } from "@/features/auth/supabase-setup-notice"
import { isSupabaseConfigured } from "@/lib/supabase/server"

export default async function ResetPasswordPage({
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
              <h1 className="text-xl font-semibold">Сброс пароля</h1>
            </CardTitle>
            <CardDescription>
              Укажите email аккаунта. Мы отправим письмо со ссылкой на установку
              нового пароля.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!configured && <SupabaseSetupNotice />}
            <AuthFormMessage error={error} message={message} />
            <form
              action={requestPasswordResetAction}
              className="flex flex-col gap-4"
            >
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
              <Button type="submit" disabled={!configured}>
                <Mail data-icon="inline-start" />
                Отправить письмо
              </Button>
            </form>
            <Link
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              href="/auth/login"
            >
              Вернуться ко входу
            </Link>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
