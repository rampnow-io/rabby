"use client"

import { useCallback, useState } from "react"

type IUseOpenCloseApi = [show: boolean, open: () => void, close: () => void]

export default function useOpenClose(initialState = false): IUseOpenCloseApi {
  const [show, setShow] = useState(initialState)
  const open = useCallback(() => {
    setShow(true)
  }, [])
  const close = useCallback(() => {
    setShow(false)
  }, [])

  return [show, open, close]
}
