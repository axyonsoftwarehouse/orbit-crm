export const SOCIAL_PUBLISH_BACKOFF_MINUTES = [1, 5, 15, 60]
export const SOCIAL_PUBLISH_MAX_RETRIES = 4

export function socialPublishNextAttemptAt(
  attempts: number,
  now: number = Date.now(),
): string {
  const index = Math.min(
    Math.max(attempts - 1, 0),
    SOCIAL_PUBLISH_BACKOFF_MINUTES.length - 1,
  )
  const minutes = SOCIAL_PUBLISH_BACKOFF_MINUTES[index] ?? 60
  return new Date(now + minutes * 60 * 1000).toISOString()
}

/**
 * Erros 4xx do provedor (exceto 429) não adianta retentar; o resto tenta de
 * novo até o limite de tentativas.
 */
export function socialPublishIsFinalFailure(
  status: number | null,
  attempts: number,
  maxRetries: number = SOCIAL_PUBLISH_MAX_RETRIES,
): boolean {
  const nonRetryable =
    status !== null && status >= 400 && status < 500 && status !== 429
  return nonRetryable || attempts >= maxRetries
}
