import React from 'react';
import AddAddressOptions from '../../AddAddressOptions';
import BottomFloatingSheet from '../../BottomFloatingPopup';
import { X } from 'lucide-react';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const AddWalletModal = ({ visible, onClose }: Props) => {
  return (
    <BottomFloatingSheet hideCloseButton open={visible} onClose={onClose}>
      <div className="h-full flex flex-col">
        <div className="px-5 pt-5 pb-3 flex justify-between items-center">
          <div className="text-xl font-medium">Accounts</div>
          <X
            size={22}
            onClick={onClose}
            className="cursor-pointer text-gray-500 hover:text-gray-700"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
          <AddAddressOptions />
        </div>
      </div>
    </BottomFloatingSheet>
  );
};

export default AddWalletModal;
