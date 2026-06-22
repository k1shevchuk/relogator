import { SiteHeader } from "@/components/site-header"
import { getContentCatalogue } from "@/domain/content-repository"
import { ResultsClient } from "@/features/results/results-client"

export const revalidate = 300

export default async function ResultsPage() {
  const catalogue = await getContentCatalogue()

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <h1 className="font-heading text-4xl font-semibold leading-tight">
            Результаты подбора
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            Список показывает не просто страны, а конкретные маршруты с уровнем
            сложности, документами, сроками и источниками.
          </p>
        </div>
        <ResultsClient catalogue={catalogue} />
      </main>
    </>
  )
}
