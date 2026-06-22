import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function SupabaseSetupNotice() {
  return (
    <Alert>
      <AlertTitle>Вход временно недоступен</AlertTitle>
      <AlertDescription>
        Мы уже знаем о проблеме. Попробуйте войти позже или продолжите подбор
        без сохранения в аккаунт.
      </AlertDescription>
    </Alert>
  )
}
