import { LegalNotice } from "@/components/legal-notice"
import { SiteHeader } from "@/components/site-header"
import { QuestionnaireFlow } from "@/features/questionnaire/questionnaire-flow"
import { ClipboardList } from "lucide-react"

export default function QuestionnairePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <section className="rounded-lg border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex max-w-3xl flex-col gap-3">
            <div className="flex w-fit items-center gap-2 rounded-md bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              <ClipboardList className="size-4" />
              первый шаг
            </div>
            <h1 className="font-heading text-4xl font-semibold leading-tight">
              Анкета Relogator
            </h1>
            <p className="text-base leading-7 text-muted-foreground">
              Ответьте на несколько вопросов. Сервис подберет маршруты по цели,
              срокам, документам и ограничениям, а не по заранее выбранной
              стране.
            </p>
          </div>
        </section>
        <LegalNotice />
        <QuestionnaireFlow />
      </main>
    </>
  )
}
