import { SiteHeader } from "@/components/site-header"
import { getContentCatalogue } from "@/domain/content-repository"
import { ResultsClient } from "@/features/results/results-client"

export const revalidate = 300

export default async function ResultsPage() {
  const catalogue = await getContentCatalogue()

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6">
        <div className="flex max-w-3xl flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold leading-tight">
            Результаты подбора
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Маршруты отсортированы по вашим ответам. Подробный план открывается
            после входа.
          </p>
        </div>
        <ResultsClient catalogue={catalogue} />
      </main>
    </>
  )
}
