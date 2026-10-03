import type { Tag } from "@/server/queries/tags"
import { TagFormDialog } from "./tag-form-dialog"
import { DeleteTagButton } from "./delete-tag-button"

export function TagsSection({ tags }: { tags: Tag[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {tags.length} tag(s) · clique em uma tag nos registros para associar.
        </p>
        <TagFormDialog label="Nova tag" />
      </div>

      {tags.length === 0 ? (
        <div className="text-muted-foreground rounded-2xl border border-dashed p-10 text-center text-sm">
          Nenhuma tag criada ainda.
        </div>
      ) : (
        <ul className="divide-y rounded-2xl border">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="inline-flex items-center gap-2 text-sm">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </span>
              <div className="flex items-center gap-1">
                <TagFormDialog tag={tag} label="Editar" />
                <DeleteTagButton id={tag.id} name={tag.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
