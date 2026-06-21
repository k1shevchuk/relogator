import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-5 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
        <p>Relogator. Справочный навигатор по маршрутам переезда.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link className="hover:text-foreground" href="/legal/terms">
            Пользовательское соглашение
          </Link>
          <Link className="hover:text-foreground" href="/legal/privacy">
            Персональные данные
          </Link>
          <Link
            className="hover:text-foreground"
            href="/legal/personal-data-consent"
          >
            Согласие
          </Link>
          <Link className="hover:text-foreground" href="/legal/cookies">
            Cookies
          </Link>
        </nav>
      </div>
    </footer>
  )
}
