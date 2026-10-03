import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CustomFieldDefinition } from "@/server/queries/custom-fields"

function displayValue(
  field: CustomFieldDefinition,
  raw: string | undefined,
): string | null {
  if (raw === undefined || raw === "") return null
  if (field.field_type === "checkbox") return raw === "true" ? "Sim" : "Não"
  if (field.field_type === "date") {
    const parsed = new Date(`${raw}T00:00:00`)
    return Number.isNaN(parsed.getTime())
      ? raw
      : parsed.toLocaleDateString("pt-BR")
  }
  return raw
}

export function CustomFieldsCard({
  fields,
  values,
}: {
  fields: CustomFieldDefinition[]
  values: Record<string, string>
}) {
  const items = fields
    .map((field) => ({ field, text: displayValue(field, values[field.id]) }))
    .filter(
      (item): item is { field: CustomFieldDefinition; text: string } =>
        item.text !== null,
    )

  if (items.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Campos personalizados</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.field.id} className="space-y-1">
              <dt className="text-muted-foreground text-xs">
                {item.field.label}
              </dt>
              <dd className="text-sm">{item.text}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
