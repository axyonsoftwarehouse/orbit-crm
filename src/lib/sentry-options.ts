import type { ErrorEvent } from "@sentry/nextjs"

/**
 * Opções comuns do Sentry (servidor, edge e navegador). Sem DSN o SDK não é
 * inicializado e todas as chamadas de captura viram no-op.
 */
export function sentryOptions(dsn: string | undefined) {
  return {
    dsn,
    enabled: Boolean(dsn),
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ??
      process.env.NODE_ENV ??
      "development",
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_RATE ?? 0),
    sendDefaultPii: false,
    beforeSend: scrubEvent,
  }
}

/** Remove dados pessoais que o SDK possa ter anexado ao evento. */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.user) event.user = { id: event.user.id }
  if (event.request) {
    delete event.request.cookies
    delete event.request.data
    if (event.request.headers) {
      const headers = { ...event.request.headers }
      for (const key of Object.keys(headers)) {
        if (/cookie|authorization/i.test(key)) delete headers[key]
      }
      event.request.headers = headers
    }
  }
  return event
}
