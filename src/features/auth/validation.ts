import { z } from "zod"

export const emailSchema = z
  .string()
  .trim()
  .email("Укажите корректный email")
  .max(254, "Email слишком длинный")

export const passwordSchema = z
  .string()
  .min(8, "Пароль должен быть не короче 8 символов")
  .max(128, "Пароль слишком длинный")

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const signUpSchema = signInSchema

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
})

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Пароли должны совпадать",
  })
