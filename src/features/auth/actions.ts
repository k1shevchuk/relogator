"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import {
  getAuthCallbackUrl,
  isSupabaseConfigured,
  sanitizeNextPath,
} from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  newPasswordSchema,
  passwordResetRequestSchema,
  signInSchema,
  signUpSchema,
} from "@/features/auth/validation"

export async function signInAction(formData: FormData) {
  const nextPath = sanitizeNextPath(String(formData.get("next") ?? ""))
  const result = await signInWithEmail(formData)

  if (result.status === "error") {
    redirectWithMessage("/auth/login", "error", result.message, {
      next: nextPath,
    })
  }

  redirect(nextPath)
}

export async function signUpAction(formData: FormData) {
  const nextPath = sanitizeNextPath(String(formData.get("next") ?? ""))
  const result = await signUpWithEmail(formData)

  if (result.status === "error") {
    redirectWithMessage("/auth/register", "error", result.message, {
      next: nextPath,
    })
  }

  redirectWithMessage("/auth/login", "message", result.message, {
    next: nextPath,
  })
}

export async function requestPasswordResetAction(formData: FormData) {
  const result = await requestPasswordReset(formData)

  if (result.status === "error") {
    redirectWithMessage("/auth/reset-password", "error", result.message)
  }

  redirectWithMessage("/auth/login", "message", result.message)
}

export async function updatePasswordAction(formData: FormData) {
  const result = await updatePassword(formData)

  if (result.status === "error") {
    redirectWithMessage("/auth/new-password", "error", result.message)
  }

  redirectWithMessage("/auth/login", "message", result.message)
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
  }

  redirect("/auth/login")
}

type AuthActionState = {
  message: string
  status: "error" | "success"
}

async function signInWithEmail(formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState()
  }

  const credentials = signInSchema.safeParse(readFormFields(formData))

  if (!credentials.success) {
    return authErrorState("Укажите корректный email и пароль.")
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword(credentials.data)

  if (error) {
    return authErrorState("Не удалось войти. Проверьте email и пароль.")
  }

  return {
    message: "Вход выполнен.",
    status: "success",
  }
}

async function signUpWithEmail(formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState()
  }

  const credentials = signUpSchema.safeParse(readFormFields(formData))

  if (!credentials.success) {
    return authErrorState(
      "Укажите корректный email, пароль от 8 символов и подтвердите оба согласия."
    )
  }

  const { email, password } = credentials.data
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl(
        sanitizeNextPath(String(formData.get("next") ?? "")),
        {
          requestOrigin: await getRequestOrigin(),
        }
      ),
    },
  })

  if (error) {
    return authErrorState("Не удалось создать аккаунт. Проверьте данные.")
  }

  return {
    message:
      "Письмо подтверждения отправлено. Откройте ссылку из письма, чтобы завершить регистрацию.",
    status: "success",
  }
}

async function requestPasswordReset(
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState()
  }

  const parsed = passwordResetRequestSchema.safeParse(readFormFields(formData))

  if (!parsed.success) {
    return authErrorState("Укажите email.")
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: getAuthCallbackUrl("/auth/new-password", {
        requestOrigin: await getRequestOrigin(),
      }),
    }
  )

  if (error) {
    return authErrorState("Не удалось отправить письмо для восстановления.")
  }

  return {
    message:
      "Если email зарегистрирован, мы отправим письмо для восстановления пароля.",
    status: "success",
  }
}

async function updatePassword(formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState()
  }

  const parsed = newPasswordSchema.safeParse(readFormFields(formData))

  if (!parsed.success) {
    return authErrorState(
      "Пароль должен быть не короче 8 символов, оба поля должны совпадать."
    )
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return authErrorState(
      "Не удалось обновить пароль. Откройте ссылку из письма еще раз."
    )
  }

  return {
    message: "Пароль обновлен. Теперь можно войти с новым паролем.",
    status: "success",
  }
}

function readFormFields(formData: FormData) {
  return {
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? ""),
    personalDataConsent: formData.get("personalDataConsent") === "on",
    termsAccepted: formData.get("termsAccepted") === "on",
  }
}

async function getRequestOrigin() {
  const headerStore = await headers()
  const forwardedProto = headerStore.get("x-forwarded-proto")
  const host = headerStore.get("host")

  return (
    headerStore.get("origin") ??
    (host ? `${forwardedProto ?? "http"}://${host}` : null)
  )
}

function authUnavailableState(): AuthActionState {
  return authErrorState("Вход временно недоступен. Попробуйте позже.")
}

function authErrorState(message: string): AuthActionState {
  return { message, status: "error" }
}

function redirectWithMessage(
  path: string,
  key: "error" | "message",
  value: string,
  extraParams: Record<string, string> = {}
) {
  redirect(`${path}?${new URLSearchParams({ [key]: value, ...extraParams })}`)
}
