import { ChainConfigMap, cn, truncate } from '@repo/utils';
import { Copy, Link, LinkType } from '../../primitives';

export interface TransactionHashProps {
  hashList: string[];
  chain?: string;
  className?: string;
}

export function getHashExplorerUrl(transactionHash: string, chain?: string) {
  if (chain && ChainConfigMap[chain]?.hashExplorerUrl) {
    return ChainConfigMap[chain].hashExplorerUrl.replace('%s', transactionHash);
  }
  return transactionHash;
}

function HashItem({
  hash,
  chain,
  className,
}: {
  hash: string;
  chain?: string;
  className?: string;
}) {
  const isExternal = chain && chain !== 'fiat';

  return (
    <div
      className={cn(
        'flex w-full gap-3 text-[14px] items-center font-medium',
        className
      )}
    >
      <span>{truncate(hash, [10, 10])}</span>
      <div className="flex items-center gap-2">
        <Copy value={hash} />
        {isExternal && (
          <Link
            href={getHashExplorerUrl(hash, chain)}
            linkType={LinkType.EXTERNAL}
          />
        )}
      </div>
    </div>
  );
}

export function TransactionHash({
  hashList,
  chain,
  className,
}: TransactionHashProps) {
  return (
    <div className="flex flex-col w-full gap-1">
      {hashList.map((hash, index) => (
        <HashItem key={index} hash={hash} chain={chain} className={className} />
      ))}
    </div>
  );
}
