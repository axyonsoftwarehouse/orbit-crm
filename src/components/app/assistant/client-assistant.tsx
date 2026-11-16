"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai"
import { Send, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type {
  DraftEmailInput,
  ProposeTaskOutput,
} from "@/lib/ai/assistant-schemas"
import type { AssistantUIMessage } from "@/server/ai/assistant/tools"
import { EmailDraftCard } from "./email-draft-card"
import {
  TaskProposalCard,
  type AssistantMember,
  type AssistantProject,
} from "./task-proposal-card"

const TASK_RESULT_TEXT: Record<ProposeTaskOutput["status"], string> = {
  created: "Tarefa criada.",
  discarded: "Proposta de tarefa descartada.",
  error: "Não foi possível criar a tarefa.",
}

function DraftShown({
  input,
  onShown,
}: {
  input: DraftEmailInput
  onShown?: () => void
}) {
  const reported = useRef(false)
  useEffect(() => {
    if (onShown && !reported.current) {
      reported.current = true
      onShown()
    }
  }, [onShown])
  return <EmailDraftCard input={input} />
}

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
  const [input, setInput] = useState("")
  const { messages, status, error, sendMessage, addToolOutput, regenerate } =
    useChat<AssistantUIMessage>({
      transport: new DefaultChatTransport({
        api: "/api/ai/cliente",
        body: { companyId },
      }),
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    })

  const busy = status === "submitted" || status === "streaming"

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    sendMessage({ text })
    setInput("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" />
          Assistente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!enabled ? (
          <p className="text-muted-foreground text-sm">
            Assistente indisponível.
          </p>
        ) : (
          <>
            <div className="max-h-[28rem] space-y-3 overflow-y-auto">
              {messages.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  Pergunte sobre este cliente, peça uma tarefa ou um rascunho de
                  e-mail.
                </p>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "bg-muted ml-8 rounded-lg px-3 py-2 text-sm"
                      : "mr-8 space-y-2 text-sm"
                  }
                >
                  {message.parts.map((part, index) => {
                    const key = `${message.id}-${index}`
                    if (part.type === "text") {
                      return (
                        <p key={key} className="whitespace-pre-wrap">
                          {part.text}
                        </p>
                      )
                    }
                    if (part.type === "tool-proposeTask") {
                      if (part.state === "input-available") {
                        return (
                          <TaskProposalCard
                            key={key}
                            companyId={companyId}
                            input={part.input}
                            projects={projects}
                            members={members}
                            currentUserId={currentUserId}
                            onResolved={(output) =>
                              addToolOutput({
                                tool: "proposeTask",
                                toolCallId: part.toolCallId,
                                output,
                              })
                            }
                          />
                        )
                      }
                      if (part.state === "output-available") {
                        const output = part.output
                        return (
                          <p key={key} className="text-muted-foreground">
                            {TASK_RESULT_TEXT[output.status]}
                          </p>
                        )
                      }
                      return null
                    }
                    if (part.type === "tool-draftEmail") {
                      if (
                        part.state === "input-available" ||
                        part.state === "output-available"
                      ) {
                        return (
                          <DraftShown
                            key={key}
                            input={part.input}
                            onShown={
                              part.state === "input-available"
                                ? () =>
                                    addToolOutput({
                                      tool: "draftEmail",
                                      toolCallId: part.toolCallId,
                                      output: { status: "shown" },
                                    })
                                : undefined
                            }
                          />
                        )
                      }
                      return null
                    }
                    return null
                  })}
                </div>
              ))}
              {busy && (
                <p className="text-muted-foreground text-sm">Pensando…</p>
              )}
            </div>

            {error && (
              <div className="flex items-center justify-between gap-2 text-sm">
                <p className="text-destructive">{error.message}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => regenerate()}
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            <form onSubmit={submit} className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) submit(e)
                }}
                placeholder="Ex.: quais faturas estão em aberto?"
                rows={2}
                aria-label="Mensagem para o assistente"
              />
              <Button
                type="submit"
                size="icon"
                disabled={busy || !input.trim()}
                aria-label="Enviar"
              >
                <Send />
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  )
}
