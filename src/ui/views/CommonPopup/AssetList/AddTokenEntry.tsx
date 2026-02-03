import React, { useImperativeHandle } from 'react';

import { ReactComponent as RcAddEntryCC } from './icons/add-entry-cc.svg';
import { ReactComponent as RcIconAdd } from '@/ui/assets/dashboard/portfolio/cc-add.svg';
import { EllipsisVertical, RotateCw, Plus } from 'lucide-react';
import clsx from 'clsx';
import { AddCustomTokenPopup } from './CustomAssetList/AddCustomTokenPopup';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { useTranslation } from 'react-i18next';
import { SpecialTokenListPopup } from './components/TokenButton';
import { useRabbySelector } from '@/ui/store';
import useSortToken from '@/ui/hooks/useSortTokens';
import { useOpenClose } from '@repo/ui';
import { useHistory } from 'react-router-dom';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/primitives';

type Props = {
  onConfirm?: React.ComponentProps<typeof AddCustomTokenPopup>['onConfirm'];
};
export type AddTokenEntryInst = {
  startAddToken: () => void;
};
const AddTokenEntry = React.forwardRef<AddTokenEntryInst, Props>(
  function AddTokenEntryPorto({ onConfirm }, ref) {
    const { t } = useTranslation();
    const history = useHistory();
    const [isShowAddModal, setIsShowAddModal] = React.useState<boolean>(false);

    useImperativeHandle(ref, () => ({
      startAddToken: () => {
        setIsShowAddModal(true);
      },
    }));

    // const [focusingToken, setFocusingToken] = React.useState<TokenItem | null>(
    //   null
    // );

    const { customize } = useRabbySelector((store) => store.account.tokens);
    const tokens = useSortToken(customize);

    const [showCustomizedTokens, setShowCustomizedTokens] = React.useState(
      false
    );

    const [isVisible, openModal, closeModal] = useOpenClose(false);

    return (
      <>
        <Popover>
          <PopoverTrigger asChild>
            <EllipsisVertical />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="bottom"
            className="!mr-1 max-w-[200px] rounded-[32px] border border-[#CACACD] bg-[rgba(250,250,250,0.75)] shadow-[0_23px_14px_4px_rgba(24,24,27,0.03)] backdrop-blur-[12px]"
          >
            <div className="flex flex-col gap-2 rounded-lg overflow-hidden">
              <button
                onClick={() => {
                  history.push('/add-token');
                }}
                className="px-5 py-[10px] text-left bg-gray-50 transition-colors flex items-center gap-3  rounded-lg border-gray-200"
              >
                <span className="text-sm font-medium text-primary-foreground">
                  Import tokens
                </span>
                <Plus className="w-5 h-5 text-primary-foreground" />
              </button>
              <button
                onClick={() => {
                  // handle refresh
                }}
                className="px-5 py-[10px] text-left bg-gray-50 transition-colors flex items-center justify-between rounded-lg"
              >
                <span className="text-sm font-medium text-primary-foreground">
                  Refresh list
                </span>
                <RotateCw className="w-5 h-5 text-primary-foreground" />
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {isVisible && (
          <AddCustomTokenPopup
            isVisible={isVisible}
            onClose={() => {
              closeModal();
            }}
            onConfirm={(addedToken) => {
              closeModal();
              setShowCustomizedTokens(true);

              // setFocusingToken(addedToken?.token || null);
              // refreshAsync();
            }}
          />
        )}

        {/* <TokenDetailPopup
          variant="add"
          token={focusingToken}
          visible={!!focusingToken}
          onClose={() => setFocusingToken(null)}
        /> */}

        <SpecialTokenListPopup
          label={
            tokens?.length > 1
              ? t('page.dashboard.tokenDetail.customizedButtons')
              : t('page.dashboard.tokenDetail.customizedButton')
          }
          buttonText={t('page.dashboard.assets.customButtonText')}
          description={t('page.dashboard.assets.customDescription')}
          onClickButton={() => {
            setShowCustomizedTokens(true);
          }}
          tokens={tokens}
          visible={showCustomizedTokens}
          onClose={() => setShowCustomizedTokens(false)}
        />
      </>
    );
  }
);

export default AddTokenEntry;
