import React from 'react';
import { useHover } from 'ui/utils';
import clsx from 'clsx';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Chain } from 'background/service/openapi';
import IconAddChain from 'ui/assets/addchain.png';
import IconChainDelete from 'ui/assets/chain-delete.png';

const ChainCard = ({
  chain,
  plus = true,
  showIcon = true,
  saveToPin,
  removeFromPin,
  className,
  onClick,
}: {
  plus: boolean;
  showIcon: boolean;
  chain?: Chain;
  saveToPin?(chain: string): void;
  removeFromPin?(chain: string): void;
  className?: string;
  onClick?(): void;
}) => {
  const [isHovering, hoverProps] = useHover();

  const {
    attributes,
    setNodeRef,
    transform,
    transition,
    listeners,
  } = useSortable({
    id: chain?.id + '',
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const save = () => {
    saveToPin && saveToPin(chain?.enum || '');
  };

  const remove = () => {
    removeFromPin && removeFromPin(chain?.enum || '');
  };

  return (
    <div
      className={clsx(
        'relative flex items-center gap-[12px] p-[16px]',
        'rounded-[8px] bg-r-neutral-card-1 border border-transparent',
        'cursor-pointer transition-all',
        isHovering && 'border-r-blue-default',
        !plus && 'pr-[48px]',
        className
      )}
      {...hoverProps}
      ref={setNodeRef}
      {...attributes}
      style={style}
      onClick={onClick}
    >
      {!plus ? (
        <div
          className={clsx('flex items-center gap-[12px] flex-1 cursor-pointer')}
          {...listeners}
        >
          <img src={chain?.logo} className="w-[32px] h-[32px] rounded-full" />
          <p className="text-r-neutral-title-1 text-[15px] font-medium flex-1">
            {chain?.name}
          </p>
        </div>
      ) : (
        <div
          className={clsx('flex items-center gap-[12px] flex-1 cursor-pointer')}
          onClick={save}
        >
          <img src={chain?.logo} className="w-[32px] h-[32px] rounded-full" />
          <p className="text-r-neutral-title-1 text-[15px] font-medium flex-1">
            {chain?.name}
          </p>
        </div>
      )}
      {showIcon && (
        <img
          src={plus ? IconAddChain : IconChainDelete}
          className="absolute right-[16px] w-[20px] h-[20px] cursor-pointer"
          onClick={plus ? save : remove}
        />
      )}
    </div>
  );
};

export default ChainCard;
