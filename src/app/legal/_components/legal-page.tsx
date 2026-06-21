import Link from "next/link"
import type { ReactNode } from "react"

import { SiteHeader } from "@/components/site-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type LegalPageProps = {
  children: ReactNode
  description: string
  title: string
}

export function LegalPage({ children, description, title }: LegalPageProps) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-2">
          <Link
            className="w-fit text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            href="/"
          >
            На главную
          </Link>
          <h1 className="font-heading text-3xl font-semibold leading-tight">
            {title}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Редакция от 21 июня 2026 года</CardTitle>
            <CardDescription>
              Документ подготовлен для MVP. Перед публичной рекламой и приемом
              платежей его нужно проверить с юристом и заполнить реквизиты
              оператора.
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none text-sm leading-7 text-foreground">
            {children}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
