"use client"

import { useEffect, useRef, useState } from "react"

interface CountdownLoaderProps {
  startTime: number // Unix time in milliseconds
  expiry: number // Duration in milliseconds
  size?: number
  children: React.ReactNode
  onExpiry?: () => void
}

const getColor = (progress: number) => {
  if (progress > 0.75) {
    return "#4A9C00"
  } else if (progress > 0.3) {
    return "#facc15"
  }

  return "#ef4444"
}

function getRemainingTime(expiryTime: number) {
  return Math.max(0, (expiryTime - Date.now()) / 1000)
}

const CountdownLoader: React.FC<CountdownLoaderProps> = ({
  startTime = Date.now(),
  expiry,
  size = 220,
  children,
  onExpiry,
}) => {
  const borderRef = useRef<SVGRectElement>(null)
  const fillRef = useRef<SVGRectElement>(null)
  const expiryTime = startTime + expiry
  const [timeLeft, setTimeLeft] = useState(getRemainingTime(expiryTime))
  const rectSize = size - 12
  const perimeter = 4 * rectSize
  const progress = (timeLeft * 1000) / (expiryTime - startTime)
  const borderOffset = perimeter * (1 - progress)
  const fillHeight = rectSize * progress
  const fillY = rectSize * (1 - progress)

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getRemainingTime(expiryTime)
      setTimeLeft(remaining)

      if (remaining === 0) {
        onExpiry?.()
        clearInterval(timer)
      }
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [expiry, onExpiry])

  return (
    <div
      className='relative flex items-center justify-center'
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className='absolute top-0 left-0'>
        <rect
          x={6}
          y={6}
          width={rectSize}
          height={rectSize}
          rx={12}
          ry={12}
          fill='transparent'
          stroke='#d1d5db'
          strokeWidth='3'
        />
        <rect
          ref={fillRef}
          x={6}
          y={6 + fillY}
          width={rectSize}
          height={fillHeight}
          rx={12}
          ry={12}
          fill='#e5e7eb'
          opacity='0.3'
        />
        <rect
          ref={borderRef}
          x={6}
          y={6}
          width={rectSize}
          height={rectSize}
          rx={12}
          ry={12}
          fill='transparent'
          stroke={getColor(progress)}
          strokeWidth='3'
          strokeDasharray={perimeter}
          strokeDashoffset={borderOffset}
          strokeLinecap='round'
        />
      </svg>
      <div className='relative z-10'>{children}</div>
      <div className='absolute -bottom-6 text-sm font-medium text-gray-700'>
        Expires in{" "}
        <span style={{ color: getColor(progress) }}>
          {Math.floor(timeLeft / 60)}:
          {(Math.round(timeLeft) % 60).toString().padStart(2, "0")} min
        </span>
      </div>
    </div>
  )
}

export { CountdownLoader }
