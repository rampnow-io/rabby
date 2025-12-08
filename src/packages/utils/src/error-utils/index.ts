import axios from "axios"

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again later."

interface ErrorWithMessage {
  message?: unknown
  error?: unknown
}

interface ErrorWithResponse {
  response?: {
    data?: ErrorWithMessage
    statusText?: string
  }
}

export function parseError(
  error: unknown,
  fallbackMsg = DEFAULT_ERROR_MESSAGE,
): string {
  // eslint-disable-next-line no-console -- Log the error for debugging purposes
  console.error(error)

  if (axios.isAxiosError(error)) {
    const response = error.response
    if (response && typeof response === "object") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- API response data may be unknown
      const messageData = response.data?.message
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- API response data may be unknown
      const errorData = response.data?.error
      const statusText = response.statusText

      const extractedMessage =
        (typeof messageData === "string" ? messageData : undefined) ??
        (typeof errorData === "string" ? errorData : undefined) ??
        statusText

      if (typeof extractedMessage === "string") {
        return extractedMessage
      }

      if (messageData !== undefined || errorData !== undefined) {
        try {
          return JSON.stringify(messageData ?? errorData)
        } catch {
          return fallbackMsg
        }
      }
      return fallbackMsg
    }
  }

  const errorObj = error as ErrorWithResponse & ErrorWithMessage
  const messageValue = errorObj.message
  const errorValue = errorObj.error

  const fallbackFromErrorObject =
    (typeof messageValue === "string" ? messageValue : undefined) ??
    (typeof errorValue === "string" ? errorValue : undefined)

  if (typeof fallbackFromErrorObject === "string") {
    return fallbackFromErrorObject
  }

  return fallbackMsg
}
