import { describe, expect, test } from "vitest"

import { toPublicAuthLinkErrorMessage } from "./auth-errors"

describe("public auth link errors", () => {
  test("hides technical expired-link errors from users", () => {
    expect(
      toPublicAuthLinkErrorMessage("Email link is invalid or has expired")
    ).toBe(
      "Ссылка уже использована, устарела или повреждена. Попробуйте войти. Если вход не получится, запросите новое письмо."
    )
  })

  test("uses a generic message for unexpected auth link errors", () => {
    expect(toPublicAuthLinkErrorMessage("unexpected provider failure")).toBe(
      "Не удалось подтвердить ссылку. Попробуйте войти или запросите новое письмо."
    )
  })
})
