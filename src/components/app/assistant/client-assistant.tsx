"use client"

import { EntityAssistant } from "./entity-assistant"
import type { AssistantMember, AssistantProject } from "./task-proposal-card"

export function ClientAssistant({
  companyId,
  enabled,
  projects,
  members,
  currentUserId,
}: {
  companyId: string
  enabled: boolean
  projects: AssistantProject[]
  members: AssistantMember[]
  currentUserId: string
}) {
  return (
    <EntityAssistant
      api="/api/ai/cliente"
      body={{ companyId }}
      enabled={enabled}
      intro="Pergunte sobre este cliente, peça uma tarefa ou um rascunho de e-mail."
      placeholder="Ex.: quais faturas estão em aberto?"
      tasks={{ companyId, projects, members, currentUserId }}
    />
  )
}
