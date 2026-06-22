import Link from "next/link"
import type { ReactNode } from "react"
import { FileText, LogOut, Route, UserCircle } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AuthFormMessage,
  readAuthSearchParams,
} from "@/features/auth/auth-form-message"
import { signOutAction } from "@/features/auth/actions"
import { SupabaseSetupNotice } from "@/features/auth/supabase-setup-notice"
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server"

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[]
    message?: string | string[]
  }>
}) {
  const { error, message } = await readAuthSearchParams(searchParams)

  if (!isSupabaseConfigured()) {
    return <AccountShell body={<SupabaseSetupNotice />} />
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <AccountShell
        body={
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Войдите в аккаунт</CardTitle>
              <CardDescription>
                После входа Relogator сможет сохранять анкеты, маршруты и заявки
                в вашем аккаунте.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/auth/login">Войти</Link>
              </Button>
            </CardContent>
          </Card>
        }
      />
    )
  }

  const [profileResult, plansResult, requestsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("saved_route_plans")
      .select("id, route_id, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("specialist_requests")
      .select("id, route_title, country_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  const role = profileResult.data?.role ?? "user"
  const plans = plansResult.data ?? []
  const requests = requestsResult.data ?? []

  return (
    <AccountShell
      body={
        <div className="flex flex-col gap-5">
          <AuthFormMessage error={error} message={message} />
          <section className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <UserCircle className="mt-0.5 size-5 text-primary" />
              <div className="flex flex-col gap-2">
                <h1 className="font-heading text-2xl font-semibold">
                  Личный кабинет
                </h1>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>{user.email}</span>
                  {role === "admin" && (
                    <Badge variant="outline">Администратор</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {role === "admin" && (
                <Button asChild variant="outline">
                  <Link href="/admin">Управление сервисом</Link>
                </Button>
              )}
              <form action={signOutAction}>
                <Button type="submit" variant="outline">
                  <LogOut data-icon="inline-start" />
                  Выйти
                </Button>
              </form>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <SummaryCard
              icon={<Route />}
              title="Маршруты"
              value={plans.length}
              description="Сохраненные планы маршрутов появятся здесь."
            />
            <SummaryCard
              icon={<FileText />}
              title="Заявки"
              value={requests.length}
              description="Ваши обращения к специалистам."
            />
          </div>

          <section className="grid gap-4 lg:grid-cols-2">
            <RecordList
              title="Сохраненные маршруты"
              empty="Сохраненных маршрутов пока нет."
              rows={plans.map((item) => ({
                id: item.id,
                title: item.route_id,
                description: item.notes
                  ? `${item.notes}, ${formatDate(item.created_at)}`
                  : `Сохранен: ${formatDate(item.created_at)}`,
              }))}
            />
            <RecordList
              title="Заявки специалистам"
              empty="Заявок пока нет."
              rows={requests.map((item) => ({
                id: item.id,
                title: `${item.country_name}: ${item.route_title}`,
                description: `${requestStatusLabels[item.status] ?? item.status}, ${formatDate(item.created_at)}`,
              }))}
            />
          </section>
        </div>
      }
    />
  )
}

function AccountShell({ body }: { body: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        {body}
      </main>
    </>
  )
}

function SummaryCard({
  description,
  icon,
  title,
  value,
}: {
  description: string
  icon: ReactNode
  title: string
  value: number
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <span className="text-primary [&_svg]:size-5">{icon}</span>
      </CardHeader>
      <CardContent>
        <span className="font-heading text-3xl font-semibold">{value}</span>
      </CardContent>
    </Card>
  )
}

function RecordList({
  empty,
  rows,
  title,
}: {
  empty: string
  rows: { id: string; title: string; description: string }[]
  title: string
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? (
          <ul className="flex flex-col gap-3 text-sm">
            {rows.map((row) => (
              <li key={row.id} className="rounded-md border p-3">
                <p className="font-medium">{row.title}</p>
                <p className="text-muted-foreground">{row.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <Alert>
            <AlertTitle>Пока пусто</AlertTitle>
            <AlertDescription>{empty}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

const requestStatusLabels: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  closed: "Закрыта",
  rejected: "Отклонена",
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
