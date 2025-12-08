import { Check, X } from "lucide-react"

export const SuccessIcon = () => (
  <div className='flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-[#B0D966] to-[#34C759]'>
    <Check className='text-white w-8 h-8' strokeWidth={3} />
  </div>
)

export const ProcessingIcon = () => (
  <div className='relative flex items-center justify-center w-11 h-11'>
    <div className='absolute inset-0 rounded-full border-[4px] border-transparent border-t-[#34C759] animate-spin'></div>
    <div className='absolute inset-0 rounded-full border-[4px] border-[#B0D966]/30'></div>
  </div>
)

export const PendingIcon = () => (
  <div className='flex items-center justify-center w-11 h-11 rounded-full border-[4px] border-gray-300' />
)

export const FailedIcon = () => (
  <div className='flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-red-600'>
    <X className='text-white w-6 h-6' strokeWidth={3} />
  </div>
)
