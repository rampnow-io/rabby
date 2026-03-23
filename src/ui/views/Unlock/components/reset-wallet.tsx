import * as React from 'react';

import { AlertTriangle } from 'lucide-react';
import {
  Button,
  ButtonType,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/primitives';
import { IconLock } from '@/ui/assets';
import { useWallet } from '@/ui/utils';
import { message } from 'antd';

type Step = 'forget' | 'warning';

interface ResetWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetWalletModal({
  open,
  onOpenChange,
}: ResetWalletModalProps) {
  const [step, setStep] = React.useState<Step>('forget');
  const wallet = useWallet();

  React.useEffect(() => {
    if (open) {
      setStep('forget');
    }
  }, [open]);

  const handleReset = React.useCallback(async () => {
    try {
      await wallet.resetBooted();
      onOpenChange(false);
      window.location.reload();
    } catch (e: any) {
      message.error(e.message);
    }
  }, [wallet, onOpenChange]);

  const isForget = step === 'forget';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px] !rounded-[32px] p-6 pb-[40px] ">
        <DialogHeader className="items-center pt-6 gap-4 text-center ">
          <div>
            {isForget ? (
              <img
                src={IconLock}
                alt="Lock icon"
                className="w-[53px] h-[70px] self-center"
              />
            ) : (
              <AlertTriangle className="w-[53px] h-[70px] text-orange-500" />
            )}
          </div>
          <div className="flex flex-col gap-3 items-center justify-center">
            <DialogTitle className="text-lg font-medium">
              {isForget ? 'Forget password' : 'Before you continue'}
            </DialogTitle>

            <DialogDescription className="text-[12px] font-normal text-center text-muted-foreground">
              {isForget ? (
                <>
                  Rampnow can’t help recover your password. <br /> You need to
                  reset your wallet by re-entering
                  <br /> your 12-word recovery phrase.
                </>
              ) : (
                <>
                  Make sure you have your 12-words recovery phrase before you
                  reset your wallet.
                  <br /> Otherwise you will not be able to recover your <br />
                  funds.
                </>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            className="rounded-full"
            buttonType={ButtonType.SECONDARY}
            onClick={() => {
              if (isForget) {
                setStep('warning');
              } else {
                handleReset();
              }
            }}
          >
            Reset wallet
          </Button>

          <button
            className="text-sm font-normal text-[454745] hover:text-gray-700"
            onClick={() => {
              if (isForget) {
                console.log('Where do I find recovery phrase');
              } else {
                console.log('I lost my recovery phrase');
              }
            }}
          >
            {isForget
              ? 'Where do i find my recovery phrase?'
              : 'I lost my recovery phrase'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
