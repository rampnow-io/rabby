import { IconAlertWarning } from '@/ui/assets';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';
import { Button } from '@repo/ui/primitives';
import React from 'react';

interface Props {
  onView: () => void;
}

const MaskModal = ({ onView }: Props) => {
  const [modalOpen, setModalOpen] = React.useState(true);
  return (
    <BottomFloatingSheet
      contentClassName="px-2"
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
    >
      <div className="mb-4 mt-2 flex justify-center ">
        <IconAlertWarning />
      </div>

      <div className="flex flex-col items-center pb-6 gap-2">
        <p className="text-primary-foreground text-base font-normal">
          View this in a private place
        </p>
        <p className="text-center text-sm text-secondary-foreground font-normal">
          Anyone who knows your recovery phrase can access your wallet and funds
        </p>
      </div>
      <Button
        onClick={() => {
          setModalOpen(false);
          onView();
        }}
        className="w-full"
      >
        View
      </Button>
    </BottomFloatingSheet>
  );
};

export default MaskModal;
