import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type AuthFormMessageProps = {
  error?: string
  message?: string
}

export function AuthFormMessage({ error, message }: AuthFormMessageProps) {
  if (!error && !message) {
    return null
  }

  return (
    <Alert variant={error ? "destructive" : "default"}>
      <AlertTitle>
        {error ? "Не удалось выполнить действие" : "Готово"}
      </AlertTitle>
      <AlertDescription>{error ?? message}</AlertDescription>
    </Alert>
  )
}

export type AuthSearchParams = Promise<{
  error?: string | string[]
  message?: string | string[]
}>

export async function readAuthSearchParams(searchParams: AuthSearchParams) {
  const params = await searchParams

  return {
    error: firstParam(params.error),
    message: firstParam(params.message),
  }
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}
