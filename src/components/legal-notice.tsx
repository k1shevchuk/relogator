import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { ShieldAlert } from "lucide-react"

type LegalNoticeProps = {
  compact?: boolean
  className?: string
}

export function LegalNotice({ compact = false, className }: LegalNoticeProps) {
  return (
    <Alert
      className={cn(
        "border-amber-200 bg-amber-50 text-amber-950",
        compact && "items-start py-2 text-sm",
        className
      )}
    >
      <ShieldAlert data-icon="inline-start" />
      <AlertTitle>{compact ? "Информация справочная" : "Справочная информация"}</AlertTitle>
      <AlertDescription>
        Правила меняются, окончательное решение принимает компетентный орган.
      </AlertDescription>
    </Alert>
  )
}
