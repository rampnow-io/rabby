"use client"

import { ArrowLeftIcon } from "lucide-react"
import { useRouter } from "next/navigation"

function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => {
        router.back()
      }}
      aria-label='Go back'
      className='flex items-center'
    >
      <ArrowLeftIcon className='h-6 w-6' />
    </button>
  )
}

BackButton.displayName = "BackButton"

export { BackButton }
