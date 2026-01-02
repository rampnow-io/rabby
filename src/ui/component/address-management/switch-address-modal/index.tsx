import React from 'react';
import BottomFloatingSheet from '../../BottomFloatingPopup';

interface Props {
  visible: boolean;
  closeAndReject: () => void;
}

const SwitchAddressModal = ({ visible, closeAndReject }: Props) => {
  return (
    <BottomFloatingSheet open={visible} onClose={closeAndReject}>
      <></>
    </BottomFloatingSheet>
  );
};

export default SwitchAddressModal;
