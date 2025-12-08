"use client"

import { useEffect, useRef } from "react"

export default function useScrollShadow(shadowSize = 30) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const element = ref.current
    let lastTopShadowSize = 0
    let lastBottomShadowSize = 0

    if (!element) {
      return
    }

    element.classList.add("scroll-shadow-inner-content")

    const animate = () => {
      const scrollTop = element.scrollTop
      const scrollHeight = element.scrollHeight
      const clientHeight = element.clientHeight

      const topShadowSize = Math.min(scrollTop, shadowSize)
      const bottomShadowSize = Math.min(
        scrollHeight - clientHeight - scrollTop,
        shadowSize,
      )

      if (topShadowSize !== lastTopShadowSize) {
        lastTopShadowSize = topShadowSize
        element.style.setProperty("--top-shadow-size", `${topShadowSize}px`)
      }

      if (bottomShadowSize !== lastBottomShadowSize) {
        lastBottomShadowSize = bottomShadowSize
        element.style.setProperty(
          "--bottom-shadow-size",
          `${bottomShadowSize}px`,
        )
      }
    }

    let animation = requestAnimationFrame(animate)

    const scheduleAnimation = () => {
      cancelAnimationFrame(animation)
      animation = requestAnimationFrame(animate)
    }

    const interval = setInterval(scheduleAnimation, 300)
    element.addEventListener("scroll", scheduleAnimation, { passive: true })
    window.addEventListener("resize", scheduleAnimation)

    return () => {
      element.classList.remove("scroll-shadow-inner-content")
      clearInterval(interval)
      element.removeEventListener("scroll", scheduleAnimation)
      window.removeEventListener("resize", scheduleAnimation)
      cancelAnimationFrame(animation)
    }
  }, [])

  return ref
}
