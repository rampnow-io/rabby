import { AlertTriangle, Info, XCircle } from "lucide-react"
import { type ReactNode, cloneElement } from "react"
import { Card, Description } from "../../primitives"

export type InfoCardVariant = "default" | "warning" | "error"

interface VariantStyle {
  text: string
  bg: string
  heading: string
  icon: ReactNode
}

const variantStyles: Record<InfoCardVariant, VariantStyle> = {
  default: {
    text: "text-secondary-foreground",
    heading: "text-[#002C15]",
    bg: "bg-[#F2F5F7]",
    icon: <Info />,
  },
  warning: {
    text: "text-[#967000]",
    heading: "text-[#EF9200]",
    bg: "bg-[#FFF8DC]",
    icon: <AlertTriangle />,
  },
  error: {
    text: "text-[#7F1D1D]",
    heading: "text-[#B91C1C]",
    bg: "bg-[#FEE2E2]",
    icon: <XCircle />,
  },
}

export interface InfoCardProps {
  heading?: string
  text: string | string[]
  numbering?: boolean
  variant?: InfoCardVariant
}

export function InfoCard({
  heading,
  text,
  numbering = false,
  variant = "default",
}: InfoCardProps) {
  const description = Array.isArray(text) ? text : text.split("\n")
  const isNumberingReq = numbering && description.length > 1

  return (
    <Card
      className={`flex w-full gap-3 border-none px-3 py-4 ${variantStyles[variant].bg}`}
    >
      <div className='flex'>
        {cloneElement(variantStyles[variant].icon as React.ReactElement<any>, {
          className: `mt-[2px] h-[18px] w-[18px] ${variantStyles[variant].heading}`,
        })}
      </div>
      <div className={`flex flex-col gap-2 ${variantStyles[variant].text}`}>
        {heading && (
          <h3
            className={`text-sm font-medium ${variantStyles[variant].heading}`}
          >
            {heading}
          </h3>
        )}

        <Description className='space-y-1 pr-2 text-sm font-normal leading-5 tracking-[-0.25px]'>
          {isNumberingReq ? (
            <ol className='list-none space-y-1'>
              {description.map((line, index) => (
                <li key={index} className='flex'>
                  <span className='mr-2 font-medium'>{index + 1}.</span>
                  <span className='mb-2 flex-1 text-justify'>{line}</span>
                </li>
              ))}
            </ol>
          ) : (
            description.map((line, index) => <p key={index}>{line}</p>)
          )}
        </Description>
      </div>
    </Card>
  )
}
