"use client"

import { useMemo, useSyncExternalStore } from "react"
import Link from "next/link"
import { FileText } from "lucide-react"

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

  return (
    <div className="flex flex-col gap-5">
      <Alert>
        <FileText data-icon="inline-start" />
        <AlertTitle>Обращения к специалистам</AlertTitle>
        <AlertDescription>
          Отправленные из аккаунта обращения хранятся в кабинете. Здесь видны
          последние обращения, созданные на этом устройстве.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">
            Последние обращения
          </h2>
          <p className="text-sm text-muted-foreground">
            Найдено: {requests.length}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/account">Открыть кабинет</Link>
          </Button>
          <Button asChild>
            <Link href="/results">К маршрутам</Link>
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
              Выберите маршрут и отправьте вопрос после входа, если хотите
              проверить документы, сроки или основание.
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
