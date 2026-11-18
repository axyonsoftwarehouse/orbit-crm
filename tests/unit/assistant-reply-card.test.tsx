import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const chat = vi.hoisted(() => ({
  messages: [] as unknown[],
  addToolOutput: vi.fn(),
}))

vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: chat.messages,
    status: "ready",
    error: undefined,
    sendMessage: vi.fn(),
    addToolOutput: chat.addToolOutput,
    regenerate: vi.fn(),
  }),
}))
vi.mock("@/server/actions/assistant", () => ({
  createAssistantTaskAction: vi.fn(),
}))

import { ReplyDraftCard } from "@/components/app/assistant/reply-draft-card"
import { EntityAssistant } from "@/components/app/assistant/entity-assistant"
import { TICKET_REPLY_FIELD_ID } from "@/components/app/assistant/constants"

describe("ReplyDraftCard", () => {
  it("Usar na resposta preenche o campo do ticket", async () => {
    Element.prototype.scrollIntoView = vi.fn()
    render(
      <>
        <textarea id={TICKET_REPLY_FIELD_ID} defaultValue="" />
        <ReplyDraftCard input={{ body: "Olá! Siga o passo a passo." }} />
      </>,
    )

    await userEvent.click(
      screen.getByRole("button", { name: /usar na resposta/i }),
    )

    const field = document.getElementById(
      TICKET_REPLY_FIELD_ID,
    ) as HTMLTextAreaElement
    expect(field.value).toBe("Olá! Siga o passo a passo.")
    expect(document.activeElement).toBe(field)
  })
})

describe("EntityAssistant", () => {
  const props = {
    api: "/api/ai/ticket",
    body: { ticketId: "k1" },
    enabled: true,
    intro: "Peça um rascunho de resposta.",
    placeholder: "Ex.: responda",
  }

  it("mostra o texto de introdução da tela", () => {
    chat.messages = []
    render(<EntityAssistant {...props} />)
    expect(
      screen.getByText("Peça um rascunho de resposta."),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Ex.: responda")).toBeInTheDocument()
  })

  it("rascunho de resposta aparece e é marcado como exibido", () => {
    chat.messages = [
      {
        id: "a1",
        role: "assistant",
        parts: [
          {
            type: "tool-draftReply",
            toolCallId: "c1",
            state: "input-available",
            input: { body: "Resposta sugerida" },
          },
        ],
      },
    ]
    render(<EntityAssistant {...props} />)

    expect(screen.getByText("Resposta sugerida")).toBeInTheDocument()
    expect(chat.addToolOutput).toHaveBeenCalledWith({
      tool: "draftReply",
      toolCallId: "c1",
      output: { status: "shown" },
    })
  })

  it("sem contexto de tarefas não mostra o cartão de tarefa", () => {
    chat.messages = [
      {
        id: "a1",
        role: "assistant",
        parts: [
          {
            type: "tool-proposeTask",
            toolCallId: "c2",
            state: "input-available",
            input: { project_id: "p1", name: "Ligar", priority: 2 },
          },
        ],
      },
    ]
    render(<EntityAssistant {...props} />)
    expect(screen.queryByRole("button", { name: /criar tarefa/i })).toBeNull()
  })
})
