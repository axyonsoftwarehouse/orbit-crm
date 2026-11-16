import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const { actionMock, chatState } = vi.hoisted(() => ({
  actionMock: vi.fn(),
  chatState: {
    error: undefined as Error | undefined,
    regenerate: vi.fn(),
  },
}))

vi.mock("@/server/actions/assistant", () => ({
  createAssistantTaskAction: actionMock,
}))

vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: [],
    status: chatState.error ? "error" : "ready",
    error: chatState.error,
    sendMessage: vi.fn(),
    addToolOutput: vi.fn(),
    regenerate: chatState.regenerate,
  }),
}))

import { TaskProposalCard } from "@/components/app/assistant/task-proposal-card"
import { EmailDraftCard } from "@/components/app/assistant/email-draft-card"
import { ClientAssistant } from "@/components/app/assistant/client-assistant"

const COMPANY = "33333333-3333-4333-8333-333333333333"
const PROJECT = "44444444-4444-4444-8444-444444444444"
const USER = "22222222-2222-4222-8222-222222222222"

const taskProps = {
  companyId: COMPANY,
  input: {
    project_id: PROJECT,
    name: "Enviar proposta",
    due_date: "2026-11-20",
    priority: 2,
  },
  projects: [{ id: PROJECT, name: "Site novo" }],
  members: [{ user_id: USER, label: "Ana" }],
  currentUserId: USER,
}

describe("TaskProposalCard", () => {
  beforeEach(() => actionMock.mockReset())

  it("Criar tarefa chama a action e resolve com created", async () => {
    actionMock.mockResolvedValue({ ok: true, taskId: "t9" })
    const onResolved = vi.fn()
    render(<TaskProposalCard {...taskProps} onResolved={onResolved} />)

    await userEvent.click(screen.getByRole("button", { name: "Criar tarefa" }))

    await waitFor(() =>
      expect(onResolved).toHaveBeenCalledWith({
        status: "created",
        taskId: "t9",
      }),
    )
    expect(actionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: COMPANY,
        project_id: PROJECT,
        name: "Enviar proposta",
        assignee_id: USER,
      }),
    )
  })

  it("erro da action mostra a mensagem e resolve com error", async () => {
    actionMock.mockResolvedValue({ ok: false, error: "Responsável inválido." })
    const onResolved = vi.fn()
    render(<TaskProposalCard {...taskProps} onResolved={onResolved} />)

    await userEvent.click(screen.getByRole("button", { name: "Criar tarefa" }))

    expect(await screen.findByText("Responsável inválido.")).toBeInTheDocument()
    expect(onResolved).toHaveBeenCalledWith({
      status: "error",
      message: "Responsável inválido.",
    })
  })

  it("Descartar resolve com discarded e não chama a action", async () => {
    const onResolved = vi.fn()
    render(<TaskProposalCard {...taskProps} onResolved={onResolved} />)

    await userEvent.click(screen.getByRole("button", { name: "Descartar" }))

    expect(onResolved).toHaveBeenCalledWith({ status: "discarded" })
    expect(actionMock).not.toHaveBeenCalled()
  })
})

describe("EmailDraftCard", () => {
  const draft = { subject: "Proposta & prazo", body: "Olá, Ana!" }

  it("rascunho sem e-mail esconde Abrir no e-mail", () => {
    render(<EmailDraftCard input={draft} />)
    expect(screen.getByText("Olá, Ana!")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Abrir no e-mail" })).toBeNull()
  })

  it("com e-mail o link é mailto com assunto codificado", () => {
    render(<EmailDraftCard input={{ ...draft, to_email: "ana@x.com" }} />)
    const link = screen.getByRole("link", { name: "Abrir no e-mail" })
    expect(link.getAttribute("href")).toBe(
      "mailto:ana@x.com?subject=Proposta%20%26%20prazo&body=Ol%C3%A1%2C%20Ana!",
    )
  })

  it("Copiar escreve assunto e corpo no clipboard", async () => {
    const user = userEvent.setup()
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue()
    render(<EmailDraftCard input={draft} />)

    await user.click(screen.getByRole("button", { name: "Copiar" }))

    expect(writeText).toHaveBeenCalledWith("Proposta & prazo\n\nOlá, Ana!")
  })
})

describe("ClientAssistant", () => {
  const props = {
    companyId: COMPANY,
    projects: [],
    members: [],
    currentUserId: USER,
  }

  beforeEach(() => {
    chatState.error = undefined
    chatState.regenerate.mockReset()
  })

  it("desabilitado mostra Assistente indisponível.", () => {
    render(<ClientAssistant {...props} enabled={false} />)
    expect(screen.getByText("Assistente indisponível.")).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).toBeNull()
  })

  it("mostra a mensagem de erro do chat e o botão Tentar novamente", async () => {
    chatState.error = new Error("Não foi possível gerar a resposta agora.")
    render(<ClientAssistant {...props} enabled />)

    expect(
      screen.getByText("Não foi possível gerar a resposta agora."),
    ).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole("button", { name: "Tentar novamente" }),
    )
    expect(chatState.regenerate).toHaveBeenCalled()
  })
})
