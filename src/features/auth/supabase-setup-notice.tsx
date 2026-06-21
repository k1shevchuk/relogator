import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function SupabaseSetupNotice() {
  return (
    <Alert>
      <AlertTitle>Supabase пока не настроен</AlertTitle>
      <AlertDescription>
        Добавьте переменные окружения из `.env.example`, затем включите Auth в
        Supabase Dashboard.
      </AlertDescription>
    </Alert>
  )
}
