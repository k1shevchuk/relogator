import { SiteHeader } from "@/components/site-header"
import { ResultsClient } from "@/features/results/results-client"

export default function ResultsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <h1 className="font-heading text-3xl font-semibold leading-tight">
            Результаты подбора
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            Список показывает не просто страны, а конкретные маршруты с уровнем
            сложности, документами, сроками и источниками.
          </p>
        </div>
        <ResultsClient />
      </main>
    </>
  )
}
