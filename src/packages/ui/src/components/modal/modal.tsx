import {
  Button,
  ButtonSize,
  type ButtonType,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../primitives"

export interface ButtonProps {
  onSubmit: () => void
  text: string
  type: ButtonType
  size?: ButtonSize
}

export interface ModalProps {
  isVisible: boolean
  onClose: (open: boolean) => void
  title: string
  description?: React.ReactNode
  buttons: ButtonProps[]
}

const Modal: React.FC<ModalProps> = ({
  isVisible,
  onClose,
  title,
  description,
  buttons,
}) => {
  return (
    <Dialog open={isVisible} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter className='sm:justify-end'>
          {buttons.map((prop, index) => (
            <Button
              type='button'
              key={index}
              buttonType={prop.type}
              onClick={prop.onSubmit}
              buttonSize={prop.size ?? ButtonSize.SM}
              className='w-[80px]'
            >
              {prop.text}
            </Button>
          ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default Modal
