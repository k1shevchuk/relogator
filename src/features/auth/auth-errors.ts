export function toPublicAuthLinkErrorMessage(message: string) {
  const normalized = message.toLowerCase()

  if (
    normalized.includes("invalid") ||
    normalized.includes("expired") ||
    normalized.includes("token") ||
    normalized.includes("otp")
  ) {
    return "Ссылка уже использована, устарела или повреждена. Попробуйте войти. Если вход не получится, запросите новое письмо."
  }

  return "Не удалось подтвердить ссылку. Попробуйте войти или запросите новое письмо."
}
