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
import { getAvatarColor, getAvatarColorStyle } from '../../utils';
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/primitives';
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
  /** Avatar color (hex code) */
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

  // 🔥 PRODUCTION FIX: Track if a child interaction is happening
  const isChildInteractingRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Use stored color if available, fallback to computed color based on address
  const colorOrClass = color
    ? getAvatarColor(color)
    : getAvatarColor(address + brandName);

  const avatarColor = colorOrClass?.startsWith('#') ? '' : colorOrClass;
  const avatarStyle = getAvatarColorStyle(colorOrClass);

  // 🔥 Prevent click if any modal is open
  const canSwitchAccount = useCallback(() => {
    return !popoverOpen && !showRenameModal;
  }, [popoverOpen, showRenameModal]);

  // 🔥 Robust click handler using event target verification
  const handleCardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Prevent if child interaction flag is set
      if (isChildInteractingRef.current) {
        isChildInteractingRef.current = false;
        return;
      }

      // Prevent if any modal/popover is open
      if (!canSwitchAccount()) {
        return;
      }

      // Verify click target is the card itself, not a descendant control
      if (
        e.target !== cardRef.current &&
        !cardRef.current?.contains(e.target as Node)
      ) {
        return;
      }

      // Final check: ensure click wasn't from interactive elements
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
      // Wait a bit for the backend to update
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
      className={`relative group flex items-center justify-between
        rounded-[16px] border-2 h-[60px] px-3
        transition-colors hover:bg-[#F4F4F4] bg-[#FAFAFA]
        ${isCurrentAccount ? 'border-[#DCFFB3]' : 'border-transparent'}
        ${!canSwitchAccount() ? 'pointer-events-auto' : ''}`}
    >
      {/* LEFT */}
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
            className="text-xs text-secondary-foreground"
          />
        </div>
      </div>

      {/* BALANCE */}
      {isCurrentAccount && (
        <div className="ml-auto text-right min-w-[90px] flex-shrink-0">
          {isUpdatingBalance ? (
            <SkeletonInput active style={{ width: 96, height: 24 }} />
          ) : (
            <span className="text-sm font-medium truncate block">
              ${splitNumberByStep(Number(balance || 0).toFixed(2))}
            </span>
          )}
        </div>
      )}

      {/* POPOVER */}
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
            className="ml-2 p-1 rounded hover:bg-gray-300
              opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <MoreVertical size={18} className="text-gray-600" />
          </div>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={6}
          className="w-[180px] border-[#CACACD] bg-[rgba(250,250,250,0.75)] shadow-[0_23px_14px_4px_rgba(24,24,27,0.03)] backdrop-blur-[12px] p-0 rounded-lg overflow-hidden"
          onClick={(e) => {
            e.stopPropagation();
            isChildInteractingRef.current = true;
          }}
        >
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
            className="w-full px-4 py-2 text-sm
              hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
          >
            <Edit size={16} />
            Rename wallet
          </div>

          {/* COPY */}
          <div
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyAddress();
              setPopoverOpen(false);
            }}
            className="w-full px-4 py-2 text-sm
              hover:bg-gray-100 flex items-center gap-2 border-t cursor-pointer"
          >
            <Copy size={16} />
            Copy address
          </div>

          {/* DELETE */}
          <div
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
              setPopoverOpen(false);
            }}
            className="w-full px-4 py-2 text-sm text-red-600
              hover:bg-red-50 flex items-center gap-2 border-t cursor-pointer"
          >
            <Trash2 size={16} />
            Remove wallet
          </div>
        </PopoverContent>
      </Popover>

      {/* RENAME MODAL */}
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
              text-white text-base font-medium ${avatarColor}`}
              style={avatarStyle}
            >
              {alias.charAt(0).toUpperCase()}
            </div>
            <AddressViewer
              className="text-secondary-foreground"
              address={address.toLowerCase()}
            />
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

export default AddressCardModal;
