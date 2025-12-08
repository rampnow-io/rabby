"use client"

import gsap from "gsap"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button, ButtonType } from "../../primitives"

gsap.registerPlugin(ScrollToPlugin)

interface CarouselProps {
  items?: React.ReactNode[]
  title?: string
}

export function Carousel({ items, title }: CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRef = useRef<HTMLDivElement>(null) // For measuring item width
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    const container = containerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)

    const scrollableWidth = container.scrollWidth - container.clientWidth
    setCanScrollRight(container.scrollLeft < scrollableWidth - 1)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    checkScroll()

    container.addEventListener("scroll", checkScroll)
    window.addEventListener("resize", checkScroll)

    return () => {
      container.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
    }
  }, [])

  const scrollByItem = (direction: "left" | "right") => {
    if (!containerRef.current || !itemRef.current) return

    const container = containerRef.current
    const itemWidth = itemRef.current.offsetWidth
    const gap = 32

    const scrollAmount = itemWidth + gap

    gsap.to(container, {
      scrollTo: {
        x:
          direction === "left"
            ? container.scrollLeft - scrollAmount
            : container.scrollLeft + scrollAmount,
      },
      duration: 0.5,
      ease: "power2.out",
      onComplete: checkScroll,
    })
  }

  return (
    <div className='flex flex-col gap-8 lg:gap-16'>
      <div className='flex flex-col gap-6 lg:flex-row lg:justify-between lg:pl-8 lg:pr-28'>
        <p className='w-4/5 text-2xl font-medium text-black lg:w-3/5 lg:text-[58px] tracking-[-1px] lg:tracking-[-2px] lg:leading-[64px]'>
          {title}
        </p>
        <div className='flex gap-3 lg:justify-end'>
          <Button
            buttonType={ButtonType.NONE}
            className='relative z-40 flex size-[72px] items-center justify-center rounded-full border-2 border-black disabled:opacity-50'
            onClick={() => {
              scrollByItem("left")
            }}
            disabled={!canScrollLeft}
          >
            <ArrowLeft strokeWidth={1} className='h-9 w-9 text-black' />
          </Button>
          <Button
            buttonType={ButtonType.NONE}
            className='relative z-40 flex size-[72px] items-center justify-center rounded-full bg-black disabled:opacity-50'
            onClick={() => {
              scrollByItem("right")
            }}
            disabled={!canScrollRight}
          >
            <ArrowRight className='h-9 w-9 text-white' strokeWidth={1} />
          </Button>
        </div>
      </div>

      {/* Carousel Container */}
      <div
        ref={containerRef}
        className='flex gap-8 overflow-x-auto scroll-smooth lg:px-8'
        style={{ scrollbarWidth: "none" }}
      >
        {items?.map((item, idx) => (
          <div key={idx} ref={idx === 0 ? itemRef : null}>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
