import Link from "next/link"
import type { ReactNode } from "react"
import { ShieldAlert, ShieldCheck } from "lucide-react"

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
import { SupabaseSetupNotice } from "@/features/auth/supabase-setup-notice"
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server"

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return <AdminShell body={<SupabaseSetupNotice />} />
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <AdminShell
        body={
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Нужен вход</CardTitle>
              <CardDescription>
                Административный раздел доступен только после входа.
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

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (currentProfile?.role !== "admin") {
    return (
      <AdminShell
        body={
          <Alert variant="destructive">
            <ShieldAlert data-icon="inline-start" />
            <AlertTitle>Доступ закрыт</AlertTitle>
            <AlertDescription>
              Роль admin назначается только вручную в Supabase SQL. Публичной
              кнопки повышения роли в продукте нет.
            </AlertDescription>
          </Alert>
        }
      />
    )
  }

  const [profilesResult, questionnairesResult, plansResult, requestsResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, role, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("user_questionnaires")
        .select("id, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("saved_route_plans")
        .select("id, user_id, route_id, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("specialist_requests")
        .select("id, user_id, country_name, route_title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ])

  const profiles = profilesResult.data ?? []
  const questionnaires = questionnairesResult.data ?? []
  const plans = plansResult.data ?? []
  const requests = requestsResult.data ?? []

  return (
    <AdminShell
      body={
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2 rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <h1 className="font-heading text-2xl font-semibold">
                Административный обзор
              </h1>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Этот раздел читает пользовательские записи через Supabase RLS.
              Роли редактируются вручную в Supabase, не из публичного
              интерфейса.
            </p>
          </section>

          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard title="Профили" value={profiles.length} />
            <MetricCard title="Анкеты" value={questionnaires.length} />
            <MetricCard title="Маршруты" value={plans.length} />
            <MetricCard title="Заявки" value={requests.length} />
          </div>

          <section className="grid gap-4 xl:grid-cols-2">
            <AdminList
              title="Профили"
              empty="Профилей пока нет."
              rows={profiles.map((item) => ({
                id: item.id,
                title: item.id,
                description: `Роль: ${item.role}, создан: ${formatDate(item.created_at)}`,
                badge: item.role,
              }))}
            />
            <AdminList
              title="Заявки специалистам"
              empty="Заявок пока нет."
              rows={requests.map((item) => ({
                id: item.id,
                title: `${item.country_name}: ${item.route_title}`,
                description: `${requestStatusLabels[item.status] ?? item.status}, пользователь ${item.user_id}`,
                badge: item.status,
              }))}
            />
            <AdminList
              title="Анкеты пользователей"
              empty="Анкет пока нет."
              rows={questionnaires.map((item) => ({
                id: item.id,
                title: `Анкета ${item.id}`,
                description: `Пользователь ${item.user_id}, ${formatDate(item.created_at)}`,
              }))}
            />
            <AdminList
              title="Сохраненные планы"
              empty="Планов пока нет."
              rows={plans.map((item) => ({
                id: item.id,
                title: item.route_id,
                description: `Пользователь ${item.user_id}, ${formatDate(item.created_at)}`,
              }))}
            />
          </section>
        </div>
      }
    />
  )
}

function AdminShell({ body }: { body: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        {body}
      </main>
    </>
  )
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <span className="font-heading text-3xl font-semibold">{value}</span>
      </CardContent>
    </Card>
  )
}

function AdminList({
  empty,
  rows,
  title,
}: {
  empty: string
  rows: { id: string; title: string; description: string; badge?: string }[]
  title: string
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Последние 20 записей.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? (
          <ul className="flex flex-col gap-3 text-sm">
            {rows.map((row) => (
              <li key={row.id} className="flex gap-3 rounded-md border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{row.title}</p>
                  <p className="truncate text-muted-foreground">
                    {row.description}
                  </p>
                </div>
                {row.badge && <Badge variant="outline">{row.badge}</Badge>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
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
