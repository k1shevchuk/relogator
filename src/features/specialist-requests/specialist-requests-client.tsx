"use client"

import { useMemo, useSyncExternalStore } from "react"
import Link from "next/link"
import { Download, FileText } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  parseSpecialistRequests,
  readSpecialistRequestsSnapshot,
  subscribeSpecialistRequests,
  type StoredSpecialistRequest,
} from "@/features/specialist-requests/request-storage"

export function SpecialistRequestsClient() {
  const rawRequests = useSyncExternalStore(
    subscribeSpecialistRequests,
    readSpecialistRequestsSnapshot,
    () => "[]"
  )

  const requests = useMemo(
    () => parseSpecialistRequests(rawRequests),
    [rawRequests]
  )
  const hasRequests = requests.length > 0
  const csv = useMemo(() => buildCsv(requests), [requests])

  return (
    <div className="flex flex-col gap-5">
      <Alert>
        <FileText data-icon="inline-start" />
        <AlertTitle>Локальный реестр заявок</AlertTitle>
        <AlertDescription>
          Это временный MVP-инструмент для проверки спроса. Заявки хранятся
          только в этом браузере; для рабочей версии нужен Supabase, роли и
          защищенный кабинет.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">
            Заявки специалисту
          </h2>
          <p className="text-sm text-muted-foreground">
            Найдено локально: {requests.length}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={!hasRequests}
            onClick={() =>
              downloadText(
                "relogator-specialist-requests.json",
                JSON.stringify(requests, null, 2),
                "application/json"
              )
            }
          >
            <Download data-icon="inline-start" />
            Скачать JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!hasRequests}
            onClick={() =>
              downloadText("relogator-specialist-requests.csv", csv, "text/csv")
            }
          >
            <Download data-icon="inline-start" />
            Скачать CSV
          </Button>
        </div>
      </div>

      {hasRequests ? (
        <section className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="rounded-lg">
              <CardHeader>
                <CardTitle>{request.countryName}</CardTitle>
                <CardDescription>{request.routeTitle}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm leading-6 md:grid-cols-[220px_1fr]">
                <dl className="grid gap-2">
                  <div>
                    <dt className="text-muted-foreground">Создана</dt>
                    <dd>{formatDate(request.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Имя</dt>
                    <dd>{request.name}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Связь</dt>
                    <dd>{request.contact}</dd>
                  </div>
                </dl>
                <div>
                  <h3 className="font-medium">Вопрос</h3>
                  <p className="text-muted-foreground">{request.question}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Заявок пока нет</CardTitle>
            <CardDescription>
              Отправьте тестовую заявку со страницы маршрута, чтобы проверить
              локальный список и экспорт.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/results">Вернуться к результатам</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function buildCsv(requests: StoredSpecialistRequest[]): string {
  const headers = [
    "createdAt",
    "name",
    "contact",
    "countryName",
    "routeId",
    "routeTitle",
    "question",
  ]

  const rows = requests.map((request) =>
    headers.map((field) =>
      csvCell(request[field as keyof StoredSpecialistRequest])
    )
  )

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

function csvCell(value: unknown): string {
  const text = String(value ?? "")
  return `"${text.replaceAll('"', '""')}"`
}

function downloadText(fileName: string, text: string, type: string) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
