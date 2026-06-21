import { describe, expect, test } from "vitest"
import {
  newPasswordSchema,
  passwordResetRequestSchema,
  signInSchema,
  signUpSchema,
} from "./validation"

describe("auth form validation", () => {
  test("accepts valid email/password credentials", () => {
    const credentials = {
      email: "user@example.com",
      password: "safe-password",
    }

    expect(signInSchema.safeParse(credentials).success).toBe(true)
    expect(
      signUpSchema.safeParse({
        ...credentials,
        personalDataConsent: true,
        termsAccepted: true,
      }).success
    ).toBe(true)
  })

  test("rejects invalid email and short password", () => {
    const result = signUpSchema.safeParse({
      email: "not-an-email",
      password: "short",
      personalDataConsent: true,
      termsAccepted: true,
    })

    expect(result.success).toBe(false)
  })

  test("requires registration consents separately", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "safe-password",
      personalDataConsent: false,
      termsAccepted: true,
    })

    expect(result.success).toBe(false)
  })

  test("validates password reset email only", () => {
    expect(
      passwordResetRequestSchema.safeParse({ email: "user@example.com" })
        .success
    ).toBe(true)
    expect(passwordResetRequestSchema.safeParse({ email: "bad" }).success).toBe(
      false
    )
  })

  test("requires matching new password confirmation", () => {
    const result = newPasswordSchema.safeParse({
      password: "safe-password",
      confirmPassword: "another-password",
    })

    expect(result.success).toBe(false)
  })
})
