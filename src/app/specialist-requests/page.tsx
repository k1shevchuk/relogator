import { SiteHeader } from "@/components/site-header"
import { SpecialistRequestsClient } from "@/features/specialist-requests/specialist-requests-client"

export default function SpecialistRequestsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold">
            Заявки специалисту
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            Локальный список обращений, отправленных из форм Relogator в этом
            браузере.
          </p>
        </div>
        <SpecialistRequestsClient />
      </main>
    </>
  )
}
