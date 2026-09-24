"use client"

import { Trash2 } from "lucide-react"
import {
  deleteFaqAction,
  deleteKbArticleAction,
  deleteKbCategoryAction,
} from "@/server/actions/kb"

function DeleteForm({
  action,
  id,
  message,
  label,
}: {
  action: (formData: FormData) => void | Promise<void>
  id: string
  message: string
  label: string
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm(message)) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label={label}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  )
}

export function DeleteArticleIcon({ id }: { id: string }) {
  return (
    <DeleteForm
      action={deleteKbArticleAction}
      id={id}
      message="Excluir este artigo?"
      label="Excluir artigo"
    />
  )
}

export function DeleteCategoryIcon({ id }: { id: string }) {
  return (
    <DeleteForm
      action={deleteKbCategoryAction}
      id={id}
      message="Excluir esta categoria?"
      label="Excluir categoria"
    />
  )
}

export function DeleteFaqIcon({ id }: { id: string }) {
  return (
    <DeleteForm
      action={deleteFaqAction}
      id={id}
      message="Excluir esta FAQ?"
      label="Excluir FAQ"
    />
  )
}
