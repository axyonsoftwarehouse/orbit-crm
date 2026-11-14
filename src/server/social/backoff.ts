export const SOCIAL_PUBLISH_BACKOFF_MINUTES = [1, 5, 15, 60]

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
