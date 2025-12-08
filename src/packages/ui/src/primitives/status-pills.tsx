import { cn } from "@repo/utils"

export enum PillStatus {
  NORMAL = "normal",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
  ALERT = "alert",
}

export enum PillType {
  DEFAULT = "default",
  PLAIN = "plain",
}

export interface StatusPillProps {
  text: string
  status: PillStatus
  type?: PillType
  className?: string
}

const styleConfig: Record<PillStatus, { bg: string; fg: string }> = {
  [PillStatus.SUCCESS]: {
    bg: "bg-[#E8F6F0]",
    fg: "text-[#12B76A]",
  },
  [PillStatus.WARNING]: {
    bg: "bg-yellow-100",
    fg: "text-yellow-800",
  },
  [PillStatus.ERROR]: {
    bg: "bg-[#FCE8ED]",
    fg: "text-[#F04438]",
  },
  [PillStatus.ALERT]: {
    bg: "bg-orange-100",
    fg: "text-orange-800",
  },
  [PillStatus.NORMAL]: {
    bg: "bg-[#FFF7EB]",
    fg: "text-[#C18900]",
  },
}

export function StatusPill({
  text,
  status,
  type = PillType.DEFAULT,
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex text-xs text-nowrap",
        {
          "rounded-full px-2 py-1 leading-5 font-semibold":
            type == PillType.DEFAULT,
        },
        { [styleConfig[status].bg]: type == PillType.DEFAULT },
        styleConfig[status].fg,
        className,
      )}
    >
      {text}
    </span>
  )
}
