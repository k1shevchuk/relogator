import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRight, Handshake, ShieldCheck, UserCheck } from "lucide-react"

import { PartnerLeadForm } from "@/components/partner-lead-form"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function PartnersPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
          <div className="flex flex-col gap-5">
            <div className="flex w-fit items-center gap-2 rounded-md border bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              <Handshake className="size-4" />
              Для специалистов и агентств
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl font-heading text-3xl font-semibold leading-tight sm:text-4xl">
                Принимайте обращения от людей, которым нужен проверенный
                следующий шаг
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                Relogator сначала показывает пользователю справочный маршрут,
                документы, сроки и источники. К специалисту человек обращается
                там, где нужна ручная проверка, подача или сопровождение.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <PartnerPoint
                icon={<UserCheck />}
                title="Заявка с контекстом"
                text="Страна, маршрут и вопрос приходят вместе, без холодного пересказа."
              />
              <PartnerPoint
                icon={<ShieldCheck />}
                title="Только с согласием"
                text="Ответы анкеты передаются специалисту только после отдельного согласия пользователя."
              />
              <PartnerPoint
                icon={<Handshake />}
                title="Ручной отбор"
                text="Партнеры добавляются после проверки направлений, опыта и каналов связи."
              />
            </div>

            <section className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">кого ищем</Badge>
                <Badge variant="outline">визы</Badge>
                <Badge variant="outline">ВНЖ</Badge>
                <Badge variant="outline">документы</Badge>
                <Badge variant="outline">адаптация</Badge>
              </div>
              <div className="grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-2">
                <div>
                  <h2 className="mb-2 font-heading text-base font-semibold text-foreground">
                    Подходит
                  </h2>
                  <p>
                    Визовым консультантам, релокационным агентствам, юристам,
                    бухгалтерам и специалистам по документам, которые работают
                    с конкретными странами и готовы отвечать по понятному
                    запросу.
                  </p>
                </div>
                <div>
                  <h2 className="mb-2 font-heading text-base font-semibold text-foreground">
                    Как это будет работать
                  </h2>
                  <p>
                    Мы сверяем направление, формат помощи и официальный канал
                    связи. После этого можем подключать специалиста к заявкам
                    пользователей по подходящим маршрутам.
                  </p>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="#partner-form">
                  Оставить заявку
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/questionnaire">Посмотреть путь пользователя</Link>
              </Button>
            </div>
          </div>

          <section id="partner-form" className="scroll-mt-24">
            <PartnerLeadForm />
          </section>
        </section>
      </main>
    </>
  )
}

function PartnerPoint({
  icon,
  text,
  title,
}: {
  icon: ReactNode
  text: string
  title: string
}) {
  return (
    <div className="flex min-h-40 flex-col justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm">
      <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground [&_svg]:size-5">
        {icon}
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-medium">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}
