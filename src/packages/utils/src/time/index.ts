import { format, parseISO } from "date-fns"
export const sleep = (timeoutMs: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeoutMs)
  })
}

export const executeAndWait = async <T>(
  operation: () => T,
  timeoutMs = 5000,
): Promise<T> => {
  const result = operation()
  await sleep(timeoutMs)
  return result
}

export const formatDate = (value?: string): string => {
  try {
    if (value) {
      return format(parseISO(value), "MMM d, y HH:mm:ss")
    }
  } catch {}

  return ""
}

export function formatDateTime(isoDate: string): {
  date: string
  time: string
} {
  const date = new Date(isoDate)

  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  }
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  }

  const formattedDate = date.toLocaleDateString("en-GB", dateOptions) // e.g., "2 Jul"
  const formattedTime = date.toLocaleTimeString("en-GB", timeOptions) // e.g., "10:30"

  return { date: formattedDate, time: formattedTime }
}

export function toUnixMilli(dateString: string): number {
  return parseISO(dateString).getTime()
}
