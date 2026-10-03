import { Badge } from "@/components/ui/badge"
import { EMAIL_TEMPLATES } from "@/lib/email-templates"
import type { EmailLogRow, EmailTemplateRow } from "@/server/queries/email"
import { EmailTemplateDialog } from "./email-template-dialog"
import { ResetEmailTemplateButton } from "./reset-email-template-button"

function extractVariables(text: string) {
  const matches = text.matchAll(/\{\{(\w+)\}\}/g)
  return Array.from(new Set(Array.from(matches, (m) => m[1])))
}

const STATUS_LABEL: Record<string, string> = {
  sent: "Enviado",
  skipped: "Ignorado",
  error: "Erro",
}

export function EmailSection({
  templates,
  log,
  canManage,
}: {
  templates: Record<string, EmailTemplateRow>
  log: EmailLogRow[]
  canManage: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-heading text-sm font-semibold">
          Modelos de e-mail
        </h2>
        <ul className="divide-y rounded-2xl border">
          {Object.entries(EMAIL_TEMPLATES).map(([key, definition]) => {
            const custom = templates[key]
            const subject = custom?.subject ?? definition.subject
            const body = custom?.body ?? definition.body
            const variables = Array.from(
              new Set([
                ...extractVariables(subject),
                ...extractVariables(body),
              ]),
            )
            return (
              <li
                key={key}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {definition.label}
                    {custom ? (
                      <Badge variant="secondary">personalizado</Badge>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {definition.description}
                  </p>
                </div>
                {canManage ? (
                  <div className="flex items-center gap-1">
                    <EmailTemplateDialog
                      templateKey={key}
                      label={definition.label}
                      description={definition.description}
                      subject={subject}
                      body={body}
                      variables={variables}
                    />
                    {custom ? (
                      <ResetEmailTemplateButton templateKey={key} />
                    ) : null}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-sm font-semibold">Envios recentes</h2>
        {log.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
            Nenhum e-mail registrado ainda.
          </p>
        ) : (
          <ul className="divide-y rounded-2xl border">
            {log.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{row.subject}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {row.to_email}
                    {row.error ? ` · ${row.error}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      row.status === "error" ? "destructive" : "secondary"
                    }
                  >
                    {STATUS_LABEL[row.status] ?? row.status}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {new Date(row.created_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
