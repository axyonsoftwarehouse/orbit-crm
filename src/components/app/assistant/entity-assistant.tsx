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
import type { ProposeTaskOutput } from "@/lib/ai/assistant-schemas"
import type { AssistantUIMessage } from "@/server/ai/assistant/common"
import { EmailDraftCard } from "./email-draft-card"
import { ReplyDraftCard } from "./reply-draft-card"
import {
  TaskProposalCard,
  type AssistantMember,
  type AssistantProject,
} from "./task-proposal-card"

function taskResultText(output: ProposeTaskOutput): string {
  if (output.status === "created") return "Tarefa criada."
  if (output.status === "discarded") return "Proposta de tarefa descartada."
  return `Não foi possível criar a tarefa: ${output.message}`
}

/** Mostra o cartão e avisa uma única vez que ele foi exibido. */
function Shown({
  children,
  onShown,
}: {
  children: React.ReactNode
  onShown?: () => void
}) {
  const reported = useRef(false)
  useEffect(() => {
    if (onShown && !reported.current) {
      reported.current = true
      onShown()
    }
  }, [onShown])
  return <>{children}</>
}

export type AssistantTaskContext = {
  companyId: string
  projects: AssistantProject[]
  members: AssistantMember[]
  currentUserId: string
}

export function EntityAssistant({
  api,
  body,
  enabled,
  intro,
  placeholder,
  tasks,
}: {
  api: string
  body: Record<string, string>
  enabled: boolean
  intro: string
  placeholder: string
  /** Sem isto, propostas de tarefa não são exibidas. */
  tasks?: AssistantTaskContext
}) {
  const [input, setInput] = useState("")
  const { messages, status, error, sendMessage, addToolOutput, regenerate } =
    useChat<AssistantUIMessage>({
      transport: new DefaultChatTransport({
        api,
        body,
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
                <p className="text-muted-foreground text-sm">{intro}</p>
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
                      if (part.state === "input-available" && tasks) {
                        return (
                          <TaskProposalCard
                            key={key}
                            companyId={tasks.companyId}
                            input={part.input}
                            projects={tasks.projects}
                            members={tasks.members}
                            currentUserId={tasks.currentUserId}
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
                            {taskResultText(output)}
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
                          <Shown
                            key={key}
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
                          >
                            <EmailDraftCard input={part.input} />
                          </Shown>
                        )
                      }
                      return null
                    }
                    if (part.type === "tool-draftReply") {
                      if (
                        part.state === "input-available" ||
                        part.state === "output-available"
                      ) {
                        return (
                          <Shown
                            key={key}
                            onShown={
                              part.state === "input-available"
                                ? () =>
                                    addToolOutput({
                                      tool: "draftReply",
                                      toolCallId: part.toolCallId,
                                      output: { status: "shown" },
                                    })
                                : undefined
                            }
                          >
                            <ReplyDraftCard input={part.input} />
                          </Shown>
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
                placeholder={placeholder}
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
