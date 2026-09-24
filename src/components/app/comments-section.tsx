import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { getActiveMembership } from "@/lib/tenant"
import { getUser } from "@/lib/auth"
import { listComments } from "@/server/queries/comments"
import { addCommentAction } from "@/server/actions/comments"
import { DeleteCommentButton } from "./delete-comment-button"

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

export async function CommentsSection({
  tenantId,
  entityType,
  entityId,
}: {
  tenantId: string
  entityType: "task" | "project"
  entityId: string
}) {
  const [comments, user, active] = await Promise.all([
    listComments(tenantId, entityType, entityId),
    getUser(),
    getActiveMembership(),
  ])
  const canModerate = active?.role === "owner" || active?.role === "admin"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comentários</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum comentário ainda.
          </p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
                  <span>
                    <span className="text-foreground font-medium">
                      {comment.author_name ?? "Usuário"}
                    </span>{" "}
                    · {formatDateTime(comment.created_at)}
                  </span>
                  {comment.author_id === user?.id || canModerate ? (
                    <DeleteCommentButton id={comment.id} />
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap">{comment.content}</p>
              </li>
            ))}
          </ul>
        )}

        <form action={addCommentAction} className="space-y-2">
          <input type="hidden" name="entity_type" value={entityType} />
          <input type="hidden" name="entity_id" value={entityId} />
          <Textarea
            name="content"
            rows={2}
            placeholder="Escreva um comentário..."
            required
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm">
              Comentar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
