export function zonedTimeToUtc(value: string, timeZone: string): Date | null {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  )
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6] ?? 0)
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    !Number.isFinite(second)
  ) {
    return null
  }

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second)

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    const parts = formatter.formatToParts(new Date(utcGuess))
    const read = (type: string) => {
      const part = parts.find((item) => item.type === type)
      return part ? Number(part.value) : 0
    }
    const hourValue = read("hour")
    const asUtc = Date.UTC(
      read("year"),
      read("month") - 1,
      read("day"),
      hourValue === 24 ? 0 : hourValue,
      read("minute"),
      read("second"),
    )
    const offset = asUtc - utcGuess
    return new Date(utcGuess - offset)
  } catch {
    return null
  }
}
