"use client"

import { cn } from "@repo/utils"
import { ExternalLink } from "lucide-react"
import { default as NextLink } from "next/link"
import { type ReactNode } from "react"

export enum LinkType {
  DEFAULT = "default",
  EXTERNAL = "external",
  INTERNAL = "internal",
}

export interface LinkProps {
  href: string
  children?: ReactNode
  className?: string
  linkType: LinkType
}

export function Link(props: LinkProps) {
  if (props.linkType === LinkType.EXTERNAL) {
    return (
      <NextLink
        href={props.href}
        target='_blank'
        className={cn("flex items-center gap-1", props.className)}
      >
        {props.children}
        <span className='flex h-5 items-center justify-center hover:bg-gray-200'>
          <ExternalLink className='h-3 w-3' />
        </span>
      </NextLink>
    )
  }

  return (
    <NextLink
      href={props.href}
      className={cn(
        "flex items-center gap-1 transition-colors hover:text-blue-600",
        props.className,
      )}
    >
      {props.children}
    </NextLink>
  )
}
