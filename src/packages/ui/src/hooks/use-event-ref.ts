"use client"

import { type MutableRefObject, useCallback, useRef } from "react"

export default function useEventRef<
  Handler extends (...args: any[]) => any,
>(): [
  (...args: Parameters<Handler>) => ReturnType<Handler> | void,
  MutableRefObject<Handler | undefined>,
] {
  const callbackRef = useRef<Handler | undefined>(undefined)
  const callback = useCallback((...args: Parameters<Handler>) => {
    if (!callbackRef.current) {
      return
    }
    return callbackRef.current(...args)
  }, [])

  return [callback, callbackRef]
}
