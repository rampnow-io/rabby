"use client"

import { cn } from "@repo/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import {
  Image,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  TooltipView,
  useSidebarContext,
} from "../../primitives"

export interface MenuItem {
  label: string
  icon?: string
  path: string
  items?: MenuItem[]
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  menu: MenuItem[]
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}

function TooltipWrapper({
  content,
  children,
}: {
  content: string
  children: React.ReactNode
}): React.ReactNode {
  const { state } = useSidebarContext()

  return state === "collapsed" ? (
    <TooltipView side='left' content={content}>
      {children}
    </TooltipView>
  ) : (
    <>{children}</>
  )
}

function SidebarMenuItemWrapper({
  item,
  isActive,
  onClick,
}: {
  item: MenuItem
  isActive: boolean
  onClick: () => void
}): React.ReactNode {
  return (
    <TooltipWrapper content={item.label}>
      <SidebarMenuItem>
        <SidebarMenuButton
          className={cn(
            "flex w-full items-center rounded-md px-3 py-2 hover:bg-gray-100",
            { "bg-[#F3FFE9] font-medium text-[#4A9C00]": isActive },
          )}
          onClick={onClick}
        >
          {item.icon ? (
            <Image
              width={24}
              height={24}
              src={item.icon}
              alt={item.label}
              className='mr-2'
            />
          ) : null}
          <p className='text-nowrap'>{item.label}</p>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </TooltipWrapper>
  )
}

function SidebarChildMenu({
  selectedGroup,
  currentPath,
}: {
  selectedGroup: MenuItem
  currentPath: string
}): React.ReactNode {
  return (
    <div className='z-50 h-full w-48 overflow-hidden border-r bg-white'>
      <SidebarGroup className='mt-4 space-y-1 px-4'>
        {selectedGroup.items?.map((child) => {
          const isActive = currentPath.startsWith(child.path)

          return (
            <TooltipWrapper key={child.label} content={child.label}>
              <Link
                href={child.path || "#"}
                className={cn(
                  "flex rounded-md px-3 py-2 text-sm font-normal hover:bg-gray-100",
                  { "bg-[#F3FFE9] text-[#4A9C00]": isActive },
                )}
              >
                {child.icon ? (
                  <Image
                    width={24}
                    height={24}
                    src={child.icon}
                    alt={child.label}
                    className='mr-2'
                  />
                ) : null}
                <p className='text-nowrap'>{child.label}</p>
              </Link>
            </TooltipWrapper>
          )
        })}
      </SidebarGroup>
    </div>
  )
}

export function AppSidebar({
  menu,
  ...props
}: AppSidebarProps): React.ReactNode {
  const currentPath = usePathname()
  const router = useRouter()
  const { state, toggleSidebar } = useSidebarContext()

  const selectedGroup = useMemo<MenuItem | null>(() => {
    menu.forEach((group) => {
      if (
        (group.items ?? [group]).some((item) =>
          currentPath.startsWith(item.path),
        )
      ) {
        return group
      }
    })

    return null
  }, [currentPath, menu])

  useEffect(() => {
    if (selectedGroup && state === "expanded") {
      toggleSidebar()
    }
  }, [selectedGroup, state, toggleSidebar])

  return (
    <div className='flex'>
      <Sidebar {...props} collapsible='icon'>
        <SidebarHeader />

        <SidebarContent>
          {menu.map((item, index): React.ReactNode => {
            const items = item.items ?? [item]

            return (
              <SidebarGroup key={item.label}>
                {(item.items ?? []).length > 0 && (
                  <SidebarGroupLabel>
                    {index !== 0 && <Separator />}
                  </SidebarGroupLabel>
                )}
                <SidebarMenu className='px-2'>
                  {items.map((subItem) => (
                    <SidebarMenuItemWrapper
                      key={`${item.label}-${subItem.label}`}
                      item={subItem}
                      isActive={currentPath.startsWith(subItem.path)}
                      onClick={() => {
                        if (subItem.path) {
                          router.push(subItem.path)
                        }
                      }}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            )
          })}
        </SidebarContent>

        <SidebarFooter className='gap-3'>
          <Separator />
          <div className='flex gap-4 px-4 py-2'>
            <SidebarTrigger className='hover:bg-gray-100' />
            {state === "expanded" && "Collapse"}
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {selectedGroup?.items ? (
        <SidebarChildMenu
          selectedGroup={selectedGroup}
          currentPath={currentPath}
        />
      ) : null}
    </div>
  )
}
