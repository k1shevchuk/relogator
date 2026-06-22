"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

const storageKey = "relogator_cookie_notice_accepted"

export function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        setVisible(window.localStorage.getItem(storageKey) !== "yes")
      } catch {
        setVisible(false)
      }
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  function accept() {
    try {
      window.localStorage.setItem(storageKey, "yes")
    } finally {
      setVisible(false)
    }
  }

  if (!visible) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Relogator использует технические cookies и локальное хранение для
          входа, сохранения анкеты, настроек и защиты сессии. Рекламная
          аналитика не подключена. Подробнее:{" "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            href="/legal/cookies"
          >
            уведомление о cookies
          </Link>
          .
        </p>
        <Button type="button" onClick={accept}>
          Понятно
        </Button>
      </div>
    </div>
  )
}
