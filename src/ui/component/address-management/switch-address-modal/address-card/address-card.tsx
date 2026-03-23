import React, {
  MouseEventHandler,
  ReactNode,
  useState,
  useRef,
  useCallback,
} from 'react';
import { Copy, MoreVertical, Edit, Trash2, X } from 'lucide-react';
import SkeletonInput from 'antd/lib/skeleton/Input';
import { Copy as TextCopyField } from '@repo/ui/primitives';

import AddressViewer from '@/ui/component/AddressViewer';
import { splitNumberByStep, useAlias } from '@/ui/utils';
import { getAvatarColor, getAvatarColorStyle } from '../../utils';
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/primitives';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';
import { truncate } from '@repo/utils';

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
  color?: string;
}

const AddressCardModal = ({
  balance,
  address,
  brandName,
  alias: aliasName,
  onSwitchCurrentAccount,
  isCurrentAccount = false,
  isUpdatingBalance,
  onDelete,
  color,
}: AddressItemProps) => {
  const [_alias, updateAlias] = useAlias(address);
  const alias = _alias || aliasName || 'Account';

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newName, setNewName] = useState(alias);
  const [isRenaming, setIsRenaming] = useState(false);

  const isChildInteractingRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const colorOrClass = color
    ? getAvatarColor(color)
    : getAvatarColor(address + brandName);

  const avatarColor = colorOrClass?.startsWith('#') ? '' : colorOrClass;
  const avatarStyle = getAvatarColorStyle(colorOrClass);

  const canSwitchAccount = useCallback(() => {
    return !popoverOpen && !showRenameModal;
  }, [popoverOpen, showRenameModal]);

  const handleCardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isChildInteractingRef.current) {
        isChildInteractingRef.current = false;
        return;
      }

      if (!canSwitchAccount()) {
        return;
      }

      if (
        e.target !== cardRef.current &&
        !cardRef.current?.contains(e.target as Node)
      ) {
        return;
      }

      const target = e.target as HTMLElement;
      if (
        target.closest('[role="button"]') ||
        target.closest('[role="menuitem"]') ||
        target.closest('[role="dialog"]') ||
        target.closest('button') ||
        target.closest('[data-no-switch]')
      ) {
        return;
      }

      onSwitchCurrentAccount?.();
    },
    [canSwitchAccount, onSwitchCurrentAccount]
  );

  const handleRename = async () => {
    if (!newName.trim()) {
      return;
    }

    try {
      setIsRenaming(true);
      await updateAlias(newName.trim());
      setTimeout(() => {
        setShowRenameModal(false);
        setIsRenaming(false);
      }, 300);
    } catch (error) {
      console.error('Failed to rename wallet:', error);
      setIsRenaming(false);
    }
  };

  const handleCopyAddress = useCallback(() => {
    isChildInteractingRef.current = true;
    navigator.clipboard.writeText(address);
  }, [address]);

  const handleDelete = useCallback(() => {
    isChildInteractingRef.current = true;
    onDelete?.();
  }, [onDelete]);

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      className={`relative group flex items-center cursor-pointer justify-between
        rounded-[16px] border h-[60px] px-3
        transition-colors hover:bg-[#FAFAFA] bg-[#FAFAFA]
        ${isCurrentAccount ? 'border-[#8ACE00]' : 'border-transparent'}
        ${!canSwitchAccount() ? 'pointer-events-auto' : ''}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`h-9 w-9 rounded-full flex items-center justify-center
          text-white text-sm font-medium flex-shrink-0 ${avatarColor}`}
          style={avatarStyle}
        >
          {alias.charAt(0).toUpperCase()}
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{alias}</div>

          <AddressViewer
            address={address.toLowerCase()}
            showArrow={false}
            isCopy={false}
            className="text-xs text-secondary-foreground"
          />
        </div>
      </div>

      <div className="ml-auto text-right min-w-[90px] flex-shrink-0 relative flex items-center justify-end">
        <div className="opacity-100 group-hover:opacity-0 transition-opacity w-full">
          {isUpdatingBalance ? (
            <SkeletonInput active style={{ width: 96, height: 24 }} />
          ) : (
            <span className="text-sm font-medium truncate block">
              ${splitNumberByStep(Number(balance || 0).toFixed(2))}
            </span>
          )}
        </div>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger
            asChild
            onClick={(e) => {
              e.stopPropagation();
              setPopoverOpen(true);
            }}
          >
            <div
              data-no-switch
              className="absolute right-0 p-1 rounded hover:bg-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <MoreVertical size={18} className="text-gray-600" />
            </div>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={6}
            className="w-[220px]  !ring-0 ring-offset-0 focus-visible:ring-0 !outline-none focus:outline-none focus-visible:outline-none !p-2 rounded-[32px] border border-[#CACACD] bg-[rgba(250,250,250,0.75)] shadow-[0_23px_14px_4px_rgba(24,24,27,0.03)] backdrop-blur-[12px]"
            onClick={(e) => {
              e.stopPropagation();
              isChildInteractingRef.current = true;
            }}
          >
            <div className="flex flex-col gap-3">
              {/* RENAME */}
              <div
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  isChildInteractingRef.current = true;
                  setPopoverOpen(false); // Close popover first
                  // Use setTimeout to ensure popover closes before modal opens
                  setTimeout(() => {
                    setNewName(alias); // Reset to current alias when opening
                    setShowRenameModal(true);
                  }, 100);
                }}
                className="px-5 w-full py-[10px] text-sm text-left bg-white transition-colors flex items-center justify-between rounded-[32px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>Rename wallet</span>
                <Edit size={18} className="flex-shrink-0" />
              </div>

              {/* COPY */}
              <div
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyAddress();
                  setPopoverOpen(false);
                }}
                className="px-5 w-full py-[10px] text-sm text-left bg-white transition-colors flex items-center justify-between rounded-[32px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>Copy address</span>
                <Copy size={18} className="flex-shrink-0" />
              </div>

              {/* DELETE */}
              <div
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                  setPopoverOpen(false);
                }}
                className="px-5 w-full py-[10px] text-sm text-left text-red-600 bg-white transition-colors flex items-center justify-between rounded-[32px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>Remove wallet</span>
                <Trash2 size={18} className="flex-shrink-0" />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <BottomFloatingSheet
        open={showRenameModal}
        contentClassName="!px-6 !pt-5 !pb-2"
        hideCloseButton={true}
        onClose={() => {
          setShowRenameModal(false);
          setNewName(alias);
        }}
        footer={
          <Button
            className="w-full"
            onClick={handleRename}
            disabled={isRenaming}
          >
            {isRenaming ? 'Saving...' : 'Done'}
          </Button>
        }
        header={
          <div className="grid grid-cols-[24px_1fr_24px] items-center w-full min-h-7">
            <div />

            <div className="font-medium text-primary-foreground text-base leading-7 text-center">
              Rename wallet
            </div>

            <button
              type="button"
              className="flex items-center justify-end cursor-pointer"
              onClick={() => setShowRenameModal(false)}
              aria-label="Close rename wallet modal"
            >
              <X size={16} />
            </button>
          </div>
        }
      >
        <div className="pb-2">
          <div className="flex flex-col items-center gap-3 mt-3">
            <div
              className={`h-14 w-14 rounded-full flex items-center justify-center
              text-white text-base font-medium ${avatarColor}`}
              style={avatarStyle}
            >
              {alias.charAt(0).toUpperCase()}
            </div>

            <TextCopyField
              value={`${address}`}
              className="text-sm font-medium text-[#030303]"
            >
              <div
                className={'text-sm text-secondary-foreground  font-normal '}
                title={address?.toLowerCase()}
              >
                {truncate(address.toLowerCase(), [10, 8])}
              </div>
            </TextCopyField>
          </div>

          <div className="mt-7">
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
        </div>
      </BottomFloatingSheet>
    </div>
  );
};

export default AddressCardModal;
