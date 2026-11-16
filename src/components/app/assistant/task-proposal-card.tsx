"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type {
  ProposeTaskInput,
  ProposeTaskOutput,
} from "@/lib/ai/assistant-schemas"
import { createAssistantTaskAction } from "@/server/actions/assistant"

const selectClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export type AssistantProject = { id: string; name: string }
export type AssistantMember = { user_id: string; label: string }

export function TaskProposalCard({
  companyId,
  input,
  projects,
  members,
  currentUserId,
  onResolved,
}: {
  companyId: string
  input: Partial<ProposeTaskInput>
  projects: AssistantProject[]
  members: AssistantMember[]
  currentUserId: string
  onResolved: (output: ProposeTaskOutput) => void
}) {
  const [name, setName] = useState(input.name ?? "")
  const [dueDate, setDueDate] = useState(input.due_date ?? "")
  const [projectId, setProjectId] = useState(input.project_id ?? "")
  const [assigneeId, setAssigneeId] = useState(currentUserId)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setPending(true)
    setError(null)
    let result: Awaited<ReturnType<typeof createAssistantTaskAction>>
    try {
      result = await createAssistantTaskAction({
        company_id: companyId,
        project_id: projectId,
        name,
        description: input.description,
        due_date: dueDate || undefined,
        priority: input.priority ?? 2,
        assignee_id: assigneeId,
      })
    } catch {
      setError("Não foi possível criar a tarefa. Tente novamente.")
      return
    } finally {
      setPending(false)
    }
    if (result.ok) {
      onResolved({ status: "created", taskId: result.taskId })
    } else {
      setError(result.error)
      onResolved({ status: "error", message: result.error })
    }
  }

  return (
    <div className="bg-background space-y-3 rounded-lg border p-3 text-sm">
      <p className="text-muted-foreground text-xs font-medium">
        Proposta de tarefa
      </p>
      <div className="space-y-1">
        <Label htmlFor="assistant-task-name">Título</Label>
        <Input
          id="assistant-task-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="assistant-task-project">Projeto</Label>
          <select
            id="assistant-task-project"
            className={selectClass}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            {!projects.some((p) => p.id === projectId) && (
              <option value="">Selecione</option>
            )}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="assistant-task-due">Prazo</Label>
          <Input
            id="assistant-task-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="assistant-task-assignee">Responsável</Label>
        <select
          id="assistant-task-assignee"
          className={selectClass}
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        >
          {!members.some((m) => m.user_id === currentUserId) && (
            <option value={currentUserId}>Eu</option>
          )}
          {members.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.label}
            </option>
          ))}
        </select>
      </div>
      {input.description && (
        <p className="text-muted-foreground whitespace-pre-wrap">
          {input.description}
        </p>
      )}
      {error && <p className="text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending || !name.trim() || !projectId}
          onClick={confirm}
        >
          Criar tarefa
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => onResolved({ status: "discarded" })}
        >
          Descartar
        </Button>
      </div>
    </div>
  )
}
