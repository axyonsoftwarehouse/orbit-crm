import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CustomFieldDefinition } from "@/server/queries/custom-fields"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function CustomFieldInputs({
  fields,
  values,
}: {
  fields: CustomFieldDefinition[]
  values?: Record<string, string>
}) {
  if (fields.length === 0) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const name = `cf_${field.key}`
        const value = values?.[field.id] ?? ""

        if (field.field_type === "checkbox") {
          return (
            <label
              key={field.id}
              className="flex items-end gap-2 pb-1.5 text-sm"
            >
              <input
                type="checkbox"
                name={name}
                defaultChecked={value === "true"}
                className="accent-primary size-4"
              />
              {field.label}
            </label>
          )
        }

        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={name}>
              {field.label}
              {field.required ? " *" : ""}
            </Label>

            {field.field_type === "textarea" ? (
              <Textarea
                id={name}
                name={name}
                rows={3}
                defaultValue={value}
                required={field.required}
              />
            ) : field.field_type === "select" ? (
              <select
                id={name}
                name={name}
                defaultValue={value}
                required={field.required}
                className={fieldClass}
              >
                <option value="">—</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={name}
                name={name}
                type={
                  field.field_type === "number"
                    ? "number"
                    : field.field_type === "date"
                      ? "date"
                      : "text"
                }
                defaultValue={value}
                required={field.required}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
