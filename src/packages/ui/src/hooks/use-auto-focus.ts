import { useEffect, useRef } from "react"

export default function useAutoFocus(timeout = 100, preventScroll = true) {
  const ref = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const timeoutId = setTimeout(() => {
      element.focus({ preventScroll })
    }, timeout)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  return ref
}
