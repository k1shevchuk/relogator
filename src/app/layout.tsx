import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"
import { CookieNotice } from "@/components/cookie-notice"
import { SiteFooter } from "@/components/site-footer"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Relogator",
  description:
    "Сервис подбора маршрутов переезда из РФ по анкете пользователя.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <SiteFooter />
        <CookieNotice />
      </body>
    </html>
  )
}
