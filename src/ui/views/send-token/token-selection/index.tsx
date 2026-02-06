import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Input, InputSize, Separator } from '@repo/ui/primitives';
import { Spin } from '@/ui/component';
import { useRabbySelector } from '@/ui/store';
import { useTokens } from '@/ui/utils/portfolio/token';
import useSearchToken from '@/ui/hooks/useSearchToken';
import useSortToken from '@/ui/hooks/useSortTokens';
import { abstractTokenToTokenItem, getTokenSymbol } from '@/ui/utils/token';
import { AbstractPortfolioToken } from '@/ui/utils/portfolio/types';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import uniqBy from 'lodash/uniqBy';
import { useWallet } from '@/ui/utils';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';

export type { TokenItem };

interface TokenSelectionProps {
  onSelect: (token: TokenItem) => void;
  selectedToken: TokenItem | null;
  loading?: boolean;
  tokens?: TokenItem[];
  chainId?: string;
  excludeTokens?: TokenItem['id'][];
  disableItemCheck?: (
    token: TokenItem
  ) => {
    disable: boolean;
    cexId?: string;
    reason: string;
    shortReason: string;
  };
  recipientAddress?: string;
}

const TokenSelection: React.FC<TokenSelectionProps> = ({
  onSelect,
  selectedToken,
  loading: externalLoading = false,
  tokens: externalTokens,
  chainId,
  excludeTokens = [],
  disableItemCheck,
  recipientAddress = '',
}) => {
  const { t } = useTranslation();
  const currentAccount = useRabbySelector(
    (state) => state.account.currentAccount
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [updateNonce, setUpdateNonce] = useState(0);

  // Format address - shows first 8 and last 4 chars with ellipsis
  const formatAddress = (address: string): string => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
  };

  // Use external tokens if provided, otherwise fetch from wallet
  const shouldLoadTokens = useMemo(
    () => !externalTokens || externalTokens.length === 0,
    [externalTokens]
  );

  const { tokens: allTokens, isLoading: isLoadingAllTokens } = useTokens(
    currentAccount?.address,
    undefined,
    shouldLoadTokens,
    updateNonce,
    chainId
  );

  const allDisplayTokens = useMemo(() => {
    if (externalTokens && externalTokens.length > 0) {
      return externalTokens as (TokenItem | AbstractPortfolioToken)[];
    }
    const abstractTokens = (allTokens as unknown) as AbstractPortfolioToken[];
    // Convert AbstractPortfolioToken to TokenItem to fix concatenated ID issue
    // Maps _tokenId (actual address) to id field
    return abstractTokens.map(abstractTokenToTokenItem);
  }, [allTokens, externalTokens]);

  const { list: searchedTokenByQuery } = useSearchToken(
    currentAccount?.address,
    searchQuery,
    chainId,
    true
  );

  const searchedDisplayTokens = useMemo(() => {
    // Convert searched tokens from AbstractPortfolioToken to TokenItem
    // This ensures token.id contains the actual contract address from _tokenId
    // instead of the concatenated id+chain value
    return searchedTokenByQuery.map(abstractTokenToTokenItem);
  }, [searchedTokenByQuery]);

  const availableTokens = useMemo(() => {
    const filtered = (searchQuery
      ? searchedDisplayTokens
      : allDisplayTokens
    ).filter((e) => !excludeTokens.includes(e.id));
    return uniqBy(filtered, (t) => `${t.chain}-${t.id}`);
  }, [searchQuery, searchedDisplayTokens, allDisplayTokens, excludeTokens]);

  const displayTokenList = useSortToken(
    availableTokens as (TokenItem | AbstractPortfolioToken)[]
  );

  const isLoading = externalLoading || isLoadingAllTokens;

  // Check if all tokens have 0 or undefined liquidity
  const allTokensHaveZeroLiquidity = useMemo(() => {
    return (
      displayTokenList.length === 0 ||
      displayTokenList.every(
        (token) => token.amount === 0 || token.amount === undefined
      )
    );
  }, [displayTokenList]);

  const handleTokenClick = useCallback(
    (token: TokenItem) => {
      const disableInfo = disableItemCheck?.(token);
      if (!disableInfo?.disable) {
        onSelect(token);
      }
    },
    [onSelect, disableItemCheck]
  );

  return (
    <div className="flex flex-col gap-5 ">
      <div
        className={`flex items-center gap-3 px-2 bg-r-neutral-bg-1 rounded-lg border ${'border-r-neutral-line'}`}
      >
        <label className="text-14 flex items-center text-secondary-foreground justify-center font-medium min-w-8">
          To
        </label>
        <Separator orientation="vertical" />
        <Input
          placeholder="Wallet Address (0x...)"
          value={recipientAddress}
          sizeVariant={InputSize.SM}
          readOnly
          className="flex-1 text-14 border-0 outline-0 bg-transparent p-0"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Spin />
        </div>
      ) : (
        <div className="flex flex-col gap-2 py-0">
          {displayTokenList.map((token) => {
            const disableInfo = disableItemCheck?.(token);
            const isDisabled = disableInfo?.disable || false;
            const isSelected =
              selectedToken?.id === token.id &&
              selectedToken?.chain === token.chain;

            // Filter out tokens with amount === 0 or undefined
            if (token.amount === 0 || token.amount === undefined) {
              return null;
            }

            return (
              <div
                key={`${token.chain}-${token.id}`}
                className={`p-4 rounded-2xl cursor-pointer bg-[#F9F9F9] transition-all duration-200 flex items-start gap-4 self-stretch ${
                  isSelected ? ' bg-white border border-gray-400' : ''
                } ${
                  isDisabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:border hover:border-gray-400 '
                }`}
                onClick={() => handleTokenClick(token)}
              >
                {token.logo_url && (
                  <img
                    src={token.logo_url}
                    alt={token.symbol}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div className="flex flex-col gap-0.5 flex-1">
                  <div className="font-semibold text-14 text-r-neutral-title-1">
                    {token.name}
                  </div>
                  <div className="text-12 text-r-neutral-body">
                    {getTokenSymbol(token)}
                  </div>
                </div>

                {isDisabled ? (
                  <div
                    className="text-11 text-r-red-default max-w-30 text-right"
                    title={disableInfo?.reason}
                  >
                    {disableInfo?.shortReason}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 text-right">
                    {token.amount !== undefined && token.amount > 0 && (
                      <div className="text-12 text-r-neutral-body">
                        {token.amount?.toFixed(4)} {getTokenSymbol(token)}
                      </div>
                    )}
                    {token.price !== undefined && token.price > 0 && (
                      <div className="text-12 font-medium text-r-neutral-title-1">
                        ${token.price.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && allTokensHaveZeroLiquidity && (
        <div className="flex flex-col items-center justify-center gap-6 py-12">
          <div className="flex items-center justify-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center">
              {/* SVG Placeholder 1 */}

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="46"
                height="46"
                viewBox="0 0 46 46"
                fill="none"
              >
                <rect width="46" height="46" rx="23" fill="black" />
                <g clip-path="url(#clip0_21234_12773)">
                  <path
                    d="M13.1774 29.1058C13.3485 28.9346 13.5785 28.8384 13.8192 28.8384H36.0946C36.5011 28.8384 36.7043 29.3304 36.4155 29.6139L32.0139 34.0101C31.8428 34.1813 31.6128 34.2776 31.3721 34.2776H9.10199C8.69552 34.2776 8.49229 33.7855 8.78109 33.5021L13.1774 29.1058Z"
                    fill="url(#paint0_linear_21234_12773)"
                  />
                  <path
                    d="M13.1774 12.6795C13.3485 12.5084 13.5785 12.4121 13.8192 12.4121H36.0946C36.5011 12.4121 36.7043 12.9041 36.4155 13.1876L32.0139 17.5839C31.8428 17.755 31.6128 17.8513 31.3721 17.8513H9.10199C8.69552 17.8513 8.49229 17.3592 8.78109 17.0758L13.1774 12.6795Z"
                    fill="url(#paint1_linear_21234_12773)"
                  />
                  <path
                    d="M32.0139 20.8377C31.8428 20.6666 31.6128 20.5703 31.3721 20.5703H9.10199C8.69552 20.5703 8.49229 21.0624 8.78109 21.3458L13.1827 25.7421C13.3539 25.9132 13.5838 26.0095 13.8245 26.0095H36.1C36.5065 26.0095 36.7097 25.5175 36.4209 25.234L32.0139 20.8377Z"
                    fill="url(#paint2_linear_21234_12773)"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_21234_12773"
                    x1="33.9678"
                    y1="9.78162"
                    x2="18.5527"
                    y2="39.3077"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#00FFA3" />
                    <stop offset="1" stop-color="#DC1FFF" />
                  </linearGradient>
                  <linearGradient
                    id="paint1_linear_21234_12773"
                    x1="27.2275"
                    y1="6.2662"
                    x2="11.8124"
                    y2="35.7922"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#00FFA3" />
                    <stop offset="1" stop-color="#DC1FFF" />
                  </linearGradient>
                  <linearGradient
                    id="paint2_linear_21234_12773"
                    x1="30.5762"
                    y1="8.01126"
                    x2="15.1611"
                    y2="37.5373"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#00FFA3" />
                    <stop offset="1" stop-color="#DC1FFF" />
                  </linearGradient>
                  <clipPath id="clip0_21234_12773">
                    <rect
                      width="29.1021"
                      height="23.2817"
                      fill="white"
                      transform="translate(8.45117 11.3564)"
                    />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className="w-16 h-16 rounded-full bg-red-400 flex items-center justify-center">
              {/* SVG Placeholder 2 */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Paste your SVG content here */}
              </svg>
            </div>
            <div className="w-16 h-16 rounded-full bg-green-700 flex items-center justify-center">
              {/* SVG Placeholder 3 */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="91"
                height="49"
                viewBox="0 0 91 49"
                fill="none"
              >
                <mask
                  id="mask0_21234_12780"
                  style="mask-type:alpha"
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="1"
                  width="46"
                  height="47"
                >
                  <circle cx="23" cy="24.2266" r="23" fill="#C4C4C4" />
                </mask>
                <g mask="url(#mask0_21234_12780)"></g>
                <g clip-path="url(#clip0_21234_12780)">
                  <path
                    d="M37.1632 9.1167H8.78027V34.9305H37.1632V9.1167Z"
                    fill="white"
                  />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M45.9535 24.2282C45.9535 36.914 35.6698 47.1976 22.9841 47.1976C10.2984 47.1976 0.0146484 36.914 0.0146484 24.2282C0.0146484 11.5425 10.2984 1.25879 22.9841 1.25879C35.6698 1.25879 45.9535 11.5425 45.9535 24.2282ZM16.4752 33.3689H12.0175C11.0808 33.3689 10.6181 33.3689 10.336 33.1884C10.0312 32.9908 9.84504 32.6636 9.82247 32.3024C9.80552 31.9696 10.0369 31.5632 10.4996 30.7506L21.5063 11.3499C21.9746 10.526 22.2116 10.1141 22.5106 9.96178C22.8323 9.79815 23.216 9.79815 23.5376 9.96178C23.8367 10.1141 24.0737 10.526 24.542 11.3499L26.8048 15.2998L26.8163 15.3199C27.3221 16.2037 27.5787 16.6519 27.6907 17.1223C27.8148 17.6358 27.8148 18.1775 27.6907 18.691C27.5778 19.165 27.3239 19.6164 26.8104 20.5136L21.0289 30.7337L21.0139 30.7599C20.5047 31.651 20.2467 32.1026 19.889 32.4434C19.4997 32.8159 19.0313 33.0866 18.5178 33.2392C18.0495 33.3689 17.5247 33.3689 16.4752 33.3689ZM27.7324 33.3689H34.1198C35.0621 33.3689 35.5362 33.3689 35.8185 33.1829C36.1231 32.9853 36.3149 32.6523 36.332 32.2914C36.3482 31.9693 36.1219 31.5787 35.6784 30.8134C35.6631 30.7873 35.6478 30.7608 35.6322 30.7338L32.4327 25.2605L32.3963 25.1988C31.9467 24.4385 31.7198 24.0546 31.4283 23.9062C31.1069 23.7425 30.7285 23.7425 30.407 23.9062C30.1136 24.0585 29.8766 24.4592 29.4083 25.2661L26.2202 30.7395L26.2092 30.7583C25.7425 31.564 25.5093 31.9665 25.5261 32.2969C25.5487 32.6581 25.7349 32.9908 26.0396 33.1884C26.3161 33.3689 26.7901 33.3689 27.7324 33.3689Z"
                    fill="#E84142"
                  />
                </g>
                <rect
                  x="42.831"
                  y="0.613229"
                  width="47.2267"
                  height="47.2267"
                  rx="23.6133"
                  fill="#002C15"
                />
                <rect
                  x="42.831"
                  y="0.613229"
                  width="47.2267"
                  height="47.2267"
                  rx="23.6133"
                  stroke="white"
                  stroke-width="1.22667"
                />
                <path
                  d="M78.5368 16.9992V13.585H64.7337L57.8896 20.4124V34.182H61.3122V18.7162C61.3122 17.7682 62.0831 16.9992 63.0334 16.9992H78.5368Z"
                  fill="white"
                />
                <path
                  d="M78.5345 23.8249V20.4106H71.5765L64.7324 27.2381V34.1792H68.1549V25.541C68.1549 24.5929 68.9258 23.8239 69.8762 23.8239H78.5355L78.5345 23.8249Z"
                  fill="white"
                />
                <g filter="url(#filter0_d_21234_12780)">
                  <rect
                    x="36.4082"
                    y="16.8667"
                    width="17.1733"
                    height="17.1733"
                    rx="8.58667"
                    fill="white"
                    shape-rendering="crispEdges"
                  />
                  <path
                    d="M48.2649 27.4954H41.7227M41.7227 27.4954L43.3582 25.8599M41.7227 27.4954L43.3582 29.131M41.7227 23.4066H48.2649M48.2649 23.4066L46.6293 21.771M48.2649 23.4066L46.6293 25.0421"
                    stroke="black"
                    stroke-width="0.797333"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </g>
                <defs>
                  <filter
                    id="filter0_d_21234_12780"
                    x="33.9549"
                    y="16.8667"
                    width="22.0795"
                    height="22.08"
                    filterUnits="userSpaceOnUse"
                    color-interpolation-filters="sRGB"
                  >
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="2.45333" />
                    <feGaussianBlur stdDeviation="1.22667" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_21234_12780"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect1_dropShadow_21234_12780"
                      result="shape"
                    />
                  </filter>
                  <clipPath id="clip0_21234_12780">
                    <rect
                      width="45.9694"
                      height="46"
                      fill="white"
                      transform="translate(0 1.22656)"
                    />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-20 font-semibold text-r-neutral-title-1">
              No tokens yet
            </h3>
            <p className="text-14 text-r-neutral-body">
              Buy your first crypto with Rampnow
            </p>
          </div>

          <Button>Buy</Button>
        </div>
      )}
    </div>
  );
};

export default TokenSelection;
