import React, {
  MouseEventHandler,
  ReactNode,
  useState,
  useRef,
  useCallback,
} from 'react';
import { Copy, MoreVertical, Edit, Trash2, X } from 'lucide-react';
import SkeletonInput from 'antd/lib/skeleton/Input';

import AddressViewer from '@/ui/component/AddressViewer';
import { splitNumberByStep, useAlias } from '@/ui/utils';
import { getAvatarColor } from '../../utils';
import { Button, Input } from '@repo/ui/primitives';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';

export interface AddressItemProps {
  balance: number;
  address: string;
  type?: string;
  brandName: string;
  className?: string;
  extra?: ReactNode;
  alias?: string;
  onClick: MouseEventHandler<HTMLDivElement>;
  onSwitchCurrentAccount?: () => void;
  enableSwitch?: boolean;
  isCurrentAccount?: boolean;
  isUpdatingBalance?: boolean;
  children?: React.ReactNode;
  onDelete?: () => void;
}

const AddressCard = ({
  balance,
  address,
  brandName,
  alias: aliasName,
  onSwitchCurrentAccount,
  isCurrentAccount = false,
  isUpdatingBalance,
  onDelete,
}: AddressItemProps) => {
  const [_alias, updateAlias] = useAlias(address);
  const alias = _alias || aliasName || 'Account';

  const [showMenu, setShowMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newName, setNewName] = useState(alias);
  const [isRenaming, setIsRenaming] = useState(false);

  const avatarColor = getAvatarColor(address + brandName);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (showMenu || showRenameModal) return;

      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('[data-menu]') ||
        target.closest('[data-no-switch]')
      ) {
        return;
      }

      onSwitchCurrentAccount?.();
    },
    [showMenu, showRenameModal, onSwitchCurrentAccount]
  );

  const handleRename = async () => {
    if (!newName.trim()) return;

    try {
      setIsRenaming(true);
      await updateAlias(newName.trim());
      setShowRenameModal(false);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setShowMenu(false);
  };

  const handleDelete = () => {
    onDelete?.();
    setShowMenu(false);
  };

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      className={`relative group flex items-center justify-between
        rounded-[16px] border-2 h-[60px] px-3
        transition-colors hover:bg-[#F4F4F4] bg-[#FAFAFA]
        ${isCurrentAccount ? 'border-[#8ACE00]' : 'border-transparent'}`}
    >
      {/* LEFT */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`h-9 w-9 rounded-full flex items-center justify-center
          text-white text-sm font-medium ${avatarColor}`}
        >
          {alias.charAt(0).toUpperCase()}
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{alias}</div>
          <AddressViewer
            address={address.toLowerCase()}
            showArrow={false}
            className="text-xs text-secondary-foreground"
          />
        </div>
      </div>

      {/* BALANCE */}
      {isCurrentAccount && (
        <div className="ml-auto text-right min-w-[90px]">
          {isUpdatingBalance ? (
            <SkeletonInput active style={{ width: 96, height: 24 }} />
          ) : (
            <span className="text-sm font-medium truncate block">
              ${splitNumberByStep(Number(balance || 0).toFixed(2))}
            </span>
          )}
        </div>
      )}

      {/* MENU */}
      <div
        data-menu
        onMouseEnter={() => setShowMenu(true)}
        onMouseLeave={() => setShowMenu(false)}
        className="relative ml-2"
      >
        <button
          data-no-switch
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu((v) => !v);
          }}
          className="p-1 rounded hover:bg-gray-300
          opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical size={18} />
        </button>

        {showMenu && (
          <div
            className="absolute right-0 mt-1 w-[180px]
            bg-white rounded-lg shadow-lg border z-50 overflow-hidden"
          >
            <button
              onClick={() => {
                setShowMenu(false);
                setNewName(alias);
                setShowRenameModal(true);
              }}
              className="w-full px-4 py-2 text-sm text-left
              hover:bg-gray-100 flex items-center gap-2"
            >
              <Edit size={16} />
              Rename wallet
            </button>

            <button
              onClick={handleCopyAddress}
              className="w-full px-4 py-2 text-sm text-left
              hover:bg-gray-100 flex items-center gap-2 border-t"
            >
              <Copy size={16} />
              Copy address
            </button>

            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-sm text-left text-red-600
              hover:bg-red-50 flex items-center gap-2 border-t"
            >
              <Trash2 size={16} />
              Remove wallet
            </button>
          </div>
        )}
      </div>

      <BottomFloatingSheet
        open={showRenameModal}
        contentClassName="!px-6 !pb-2"
        hideCloseButton={true}
        onClose={() => {
          setShowRenameModal(false);
          setNewName(alias);
        }}
      >
        <div className="pb-10">
          <div className="flex justify-between items-center pt-6">
            <div />
            <div className="font-normal text-primary-foreground text-base">
              Rename wallet
            </div>
            <X
              size={22}
              className="cursor-pointer"
              onClick={() => setShowRenameModal(false)}
            />
          </div>

          <div className="flex flex-col items-center gap-3 mt-6">
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center
              text-secondary-foreground text-base font-medium ${avatarColor}`}
            >
              {alias.charAt(0).toUpperCase()}
            </div>
            <AddressViewer address={address.toLowerCase()} />
          </div>

          <div className="mt-6">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={isRenaming}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setShowRenameModal(false);
              }}
            />
          </div>

          <div className=" mt-4 w-full">
            <Button
              className="w-full"
              onClick={handleRename}
              disabled={isRenaming}
            >
              {isRenaming ? 'Saving...' : 'Done'}
            </Button>
          </div>
        </div>
      </BottomFloatingSheet>
    </div>
  );
};

export default AddressCard;
