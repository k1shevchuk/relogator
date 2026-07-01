import { SiteHeader } from "@/components/site-header"
import { getContentCatalogue } from "@/domain/content-repository"
import { ResultsClient } from "@/features/results/results-client"

export const revalidate = 300

export default async function ResultsPage() {
  const catalogue = await getContentCatalogue()

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <ResultsClient catalogue={catalogue} />
      </main>
    </>
  )
}
