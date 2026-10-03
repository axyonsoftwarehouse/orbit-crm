import {
  CUSTOM_FIELD_ENTITIES,
  CUSTOM_FIELD_TYPES,
  type CustomFieldEntity,
  type CustomFieldType,
} from "@/lib/constants"
import type { CustomFieldDefinition } from "@/server/queries/custom-fields"
import { CustomFieldFormDialog } from "./custom-field-form-dialog"
import { DeleteCustomFieldButton } from "./delete-custom-field-button"

export function CustomFieldsSection({
  definitions,
}: {
  definitions: CustomFieldDefinition[]
}) {
  return (
    <div className="space-y-6">
      {(
        Object.entries(CUSTOM_FIELD_ENTITIES) as [
          CustomFieldEntity,
          { label: string },
        ][]
      ).map(([entity, config]) => {
        const items = definitions.filter(
          (definition) => definition.entity_type === entity,
        )
        return (
          <div key={entity} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-sm font-semibold">
                {config.label}
                <span className="text-muted-foreground ml-2 text-xs font-normal">
                  {items.length}
                </span>
              </h2>
              <CustomFieldFormDialog entityType={entity} label="Novo campo" />
            </div>

            {items.length === 0 ? (
              <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
                Nenhum campo.
              </p>
            ) : (
              <ul className="divide-y rounded-2xl border">
                {items.map((field) => (
                  <li
                    key={field.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-sm">
                        {field.label}
                        {field.required ? (
                          <span className="text-destructive"> *</span>
                        ) : null}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {CUSTOM_FIELD_TYPES[field.field_type as CustomFieldType]
                          ?.label ?? field.field_type}{" "}
                        · {field.key}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <CustomFieldFormDialog
                        entityType={entity}
                        field={field}
                        label="Editar"
                      />
                      <DeleteCustomFieldButton
                        id={field.id}
                        label={field.label}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
