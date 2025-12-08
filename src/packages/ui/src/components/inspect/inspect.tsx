"use client"

import { type ReactNode, useEffect, useState } from "react"
import {
  Button,
  ButtonSize,
  ButtonType,
  CodeView,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Image,
  useToast,
} from "../../primitives"
import { Loader } from "../loader"

export interface Props {
  dataFetcher: () => Promise<Record<string, any>>
  heading?: string
  buttonType?: ButtonType | null | undefined
  buttonSize?: ButtonSize | null | undefined
  children: ReactNode
}

function Inspect({
  dataFetcher,
  heading = "Inspect",
  buttonType = ButtonType.PRIMARY,
  buttonSize = ButtonSize.SM,
  children,
}: Props) {
  const { toast } = useToast()
  const [data, setData] = useState<Record<string, any>>({})
  const [isDialogVisible, setIsDialogVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isDialogVisible) {
      setIsLoading(true)

      dataFetcher()
        .then((data) => {
          setData(data)
        })
        .catch((error) => {
          setData({ error })
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isDialogVisible])

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    toast({ title: "Success", description: "Copied" })
  }

  return (
    <>
      <Button
        buttonType={buttonType}
        buttonSize={buttonSize}
        className='flex items-center gap-2'
        onClick={() => {
          setIsDialogVisible(!isDialogVisible)
        }}
      >
        <Image
          src='/image/icon/general/code.svg'
          alt='logo'
          width={18}
          height={18}
        />
        <p>{children}</p>
      </Button>
      <Dialog
        open={isDialogVisible}
        onOpenChange={() => {
          setIsDialogVisible(!isDialogVisible)
        }}
      >
        <DialogContent className='max-h-[70vh] min-h-[70vh] min-w-[70vh] max-w-[100vh]'>
          <DialogHeader>
            <DialogTitle> {heading} </DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <div className='min-h-[50vh]'>
              <Loader />
            </div>
          ) : (
            <>
              <div className='flex justify-end'>
                <Button buttonSize={ButtonSize.SM} onClick={handleCopy}>
                  Copy
                </Button>
              </div>
              <CodeView data={data} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

Inspect.displayName = "Inspect"

export default Inspect
