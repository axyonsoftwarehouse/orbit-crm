import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function SeoScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return <Badge variant="outline">Sem nota</Badge>
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-10 items-center justify-center rounded-full px-2 text-xs font-semibold",
        score >= 80
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : score >= 50
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
            : "bg-destructive/10 text-destructive",
      )}
    >
      {score}
    </span>
  )
}

export function SeoAuditStatusBadge({ status }: { status: number }) {
  if (status === 1) {
    return <Badge variant="secondary">Executando</Badge>
  }
  if (status === 3) {
    return <Badge variant="destructive">Erro</Badge>
  }
  return (
    <Badge
      variant="outline"
      className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
    >
      Concluída
    </Badge>
  )
}

export function SeoCheckStatusBadge({
  status,
}: {
  status: "pass" | "warn" | "fail"
}) {
  if (status === "pass") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
      >
        OK
      </Badge>
    )
  }
  if (status === "warn") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/30 text-amber-700 dark:text-amber-400"
      >
        Atenção
      </Badge>
    )
  }
  return <Badge variant="destructive">Falha</Badge>
}

export function SeoSeverityBadge({
  severity,
}: {
  severity: "major" | "moderate" | "minor"
}) {
  const label =
    severity === "major"
      ? "Crítico"
      : severity === "moderate"
        ? "Moderado"
        : "Leve"

  return <Badge variant="secondary">{label}</Badge>
}
