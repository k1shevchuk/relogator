import { LegalNotice } from "@/components/legal-notice"
import { SiteHeader } from "@/components/site-header"
import { QuestionnaireFlow } from "@/features/questionnaire/questionnaire-flow"
import { ClipboardList } from "lucide-react"

export default function QuestionnairePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-5 sm:px-6">
        <section className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex max-w-3xl flex-col gap-3">
            <div className="flex w-fit items-center gap-2 rounded-md bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              <ClipboardList className="size-4" />
              первый шаг
            </div>
            <h1 className="font-heading text-3xl font-semibold leading-tight">
              Подбор маршрута
            </h1>
            <p className="text-base leading-7 text-muted-foreground">
              Ответьте на несколько вопросов. Страны и маршруты появятся после
              расчета.
            </p>
          </div>
        </section>
        <LegalNotice compact />
        <QuestionnaireFlow />
      </main>
    </>
  )
}
