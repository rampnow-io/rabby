import { Bell } from "lucide-react"
import { Image } from "../../primitives"

interface AppHeaderProps {
  userMenu: React.ReactNode
}

function AppHeader({ userMenu }: AppHeaderProps): React.ReactNode {
  return (
    <div className='fixed top-0 !z-[99] flex h-[68px] w-full items-center justify-between border-b bg-white px-5'>
      <Image
        width={128}
        height={24}
        src='/image/logo/full-black.svg'
        alt='Rampnow Logo'
      />
      <div className='hidden md:block'>
        <div className='flex items-center justify-between gap-4'>
          <Bell />
          {userMenu}
        </div>
      </div>
    </div>
  )
}

export { AppHeader }
