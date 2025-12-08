"use client"

import { useEffect, useState } from "react"

export interface BrowserDetails {
  colorDepth: string
  javaEnabled: boolean
  lang: string
  screenHeight: string
  screenWidth: string
  timezone: string
  windowSize: string
  userAgent: string
  acceptHeader: string
}

export interface Fingerprint {
  signature?: string
  browserDetails: BrowserDetails | null
}

const WINDOW_SIZE_BREAKPOINTS = {
  TINY: 250,
  SMALL: 390,
  MEDIUM: 500,
  LARGE: 600,
}

const getWindowSize = (): string => {
  if (typeof window === "undefined") return "00"

  const width = window.innerWidth

  if (width < WINDOW_SIZE_BREAKPOINTS.TINY) return "01"
  if (width < WINDOW_SIZE_BREAKPOINTS.SMALL) return "02"
  if (width < WINDOW_SIZE_BREAKPOINTS.MEDIUM) return "03"
  if (width < WINDOW_SIZE_BREAKPOINTS.LARGE) return "04"
  return "05"
}

const getBrowserDetails = (): BrowserDetails | null => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return null
  }

  return {
    colorDepth: `${window.screen.colorDepth}`,
    javaEnabled: navigator.javaEnabled(),
    lang: navigator.language,
    screenHeight: `${window.screen.height}`,
    screenWidth: `${window.screen.width}`,
    timezone: `${new Date().getTimezoneOffset()}`,
    windowSize: getWindowSize(),
    userAgent: navigator.userAgent,
    acceptHeader: "text/html",
  }
}

export default function useFingerprint(orderId: string | undefined): {
  fingerprint: Fingerprint | null
} {
  const [fingerprint, setFingerprint] = useState<Fingerprint | null>(null)

  useEffect(() => {
    if (!orderId) return
    // @ts-ignore
    if (typeof window === "undefined" || Boolean(!window.getCollectorData)) {
      return
    }

    // @ts-ignore
    const getCollectorData = window.getCollectorData(orderId)
    const browserDetails = getBrowserDetails()

    getCollectorData
      .then((signature: any) => {
        setFingerprint({ browserDetails, signature })
      })
      .catch((error: any) => {
        setFingerprint({ browserDetails })
        console.error("Error collecting fingerprint:", error)
      })
  }, [orderId])

  return { fingerprint }
}
