import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from "lucide-react"

export function LegalNotice() {
  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-950">
      <ShieldAlert data-icon="inline-start" />
      <AlertTitle>Справочная информация</AlertTitle>
      <AlertDescription>
        Relogator не заменяет юридическую консультацию. Правила меняются, а
        окончательное решение принимает компетентный орган страны.
      </AlertDescription>
    </Alert>
  )
}
