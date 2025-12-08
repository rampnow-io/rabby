import { type ReactNode } from "react"

export enum SnackbarType {
  SUCCESS = "success",
  INFO = "info",
  WARNING = "warning",
}

export interface SnackbarOptions {
  persistent?: boolean
  timeout?: number
}

export type Handler = (
  type: SnackbarType,
  message: ReactNode,
  options?: SnackbarOptions,
) => void

let handlers: Handler[] = []

export function showSnackbar(
  type: SnackbarType,
  message: ReactNode,
  options?: SnackbarOptions,
) {
  handlers.forEach((handler) => {
    handler(type, message, options)
  })
}

export function subscribe(newHandler: Handler) {
  handlers = [newHandler, ...handlers]

  return function unsubscribe() {
    handlers = handlers.filter((handler) => handler !== newHandler)
  }
}
