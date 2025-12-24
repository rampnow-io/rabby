import React, { useState } from 'react';
import clsx from 'clsx';
import { useHistory } from 'react-router-dom';
import { UiProvider } from '@/ui/component/NewUserImport';
import { ReactComponent as RcIconArrowDownCC } from '@/ui/assets/new-user-import/arrow-down-cc.svg';
import {
  BRAND_ALIAN_TYPE_TEXT,
  KEYRING_CLASS,
  KEYRING_ICONS,
  KEYRING_TYPE,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/constant';
import { HeaderNavPage, Item } from '@/ui/component';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'antd';
import qs from 'qs';
import { Container, Content } from '@repo/ui';
import SectionHeader from '@/ui/component/section-header/section-header';

export const ImportWalletList = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const [showMore, setShowMore] = useState(false);

  const tipList = React.useMemo(
    () => [
      {
        type: KEYRING_TYPE.HdKeyring,
        logo: KEYRING_ICONS[KEYRING_TYPE.HdKeyring],
      },
      {
        type: KEYRING_TYPE.SimpleKeyring,
        logo: KEYRING_ICONS[KEYRING_TYPE.SimpleKeyring],
      },
      {
        type: KEYRING_CLASS.HARDWARE.LEDGER,
        logo: WALLET_BRAND_CONTENT[WALLET_BRAND_TYPES.LEDGER].icon,
        preventClick:
          WALLET_BRAND_CONTENT[WALLET_BRAND_TYPES.LEDGER].preventClick,
        tipI18nKey: WALLET_BRAND_CONTENT[WALLET_BRAND_TYPES.LEDGER].tipI18nKey,
      },
      {
        type: KEYRING_CLASS.HARDWARE.TREZOR,
        logo: WALLET_BRAND_CONTENT[WALLET_BRAND_TYPES.TREZOR].icon,
      },
      {
        type: KEYRING_CLASS.HARDWARE.ONEKEY,
        logo: WALLET_BRAND_CONTENT[WALLET_BRAND_TYPES.ONEKEY].icon,
      },
      {
        type: KEYRING_CLASS.HARDWARE.KEYSTONE,
        logo: WALLET_BRAND_CONTENT[WALLET_BRAND_TYPES.KEYSTONE].icon,
        brand: WALLET_BRAND_CONTENT[WALLET_BRAND_TYPES.KEYSTONE].brand,
      },
      {
        type: KEYRING_CLASS.HARDWARE.GRIDPLUS,
        logo: WALLET_BRAND_CONTENT[WALLET_BRAND_TYPES.GRIDPLUS].icon,
      },
      {
        type: KEYRING_CLASS.HARDWARE.BITBOX02,
        logo: WALLET_BRAND_CONTENT[WALLET_BRAND_TYPES.BITBOX02].icon,
      },
      {
        type: KEYRING_CLASS.GNOSIS,
        logo: WALLET_BRAND_CONTENT[WALLET_BRAND_TYPES.GNOSIS].icon,
      },
      {
        type: KEYRING_CLASS.HARDWARE.KEYSTONE,
        logo: WALLET_BRAND_CONTENT[WALLET_BRAND_TYPES.NGRAVEZERO].icon,
        brand: WALLET_BRAND_CONTENT[WALLET_BRAND_TYPES.NGRAVEZERO].brand,
      },
    ],
    []
  );

  const gotoImport = (
    type: typeof tipList[number]['type'],
    brand?: typeof tipList[number]['brand']
  ) => {
    switch (type) {
      case KEYRING_TYPE.SimpleKeyring:
        history.push('/new-user/import/private-key');
        break;
      case KEYRING_TYPE.HdKeyring:
        history.push('/new-user/import/seed-phrase');
        break;
      case KEYRING_CLASS.HARDWARE.LEDGER:
      case KEYRING_CLASS.HARDWARE.KEYSTONE:
      case KEYRING_CLASS.HARDWARE.ONEKEY:
      case KEYRING_CLASS.HARDWARE.TREZOR:
      case KEYRING_CLASS.HARDWARE.GRIDPLUS:
      case KEYRING_CLASS.HARDWARE.BITBOX02:
        history.push({
          pathname: `/new-user/import/${type}/set-password`,
          search: qs.stringify({ brand }),
        });
        break;
      case KEYRING_CLASS.GNOSIS:
        history.push('/new-user/import/gnosis-address');
        break;
      default:
        history.push('/new-user/import/seed-phrase');
    }
  };

  return (
    <UiProvider>
      <Container>
        <HeaderNavPage
          handleBack={() => {
            history.length
              ? history.goBack()
              : history.replace('/new-user/guide');
          }}
        />
        <SectionHeader
          className="flex flex-col items-center"
          title={t('page.newUserImport.importList.title')}
        />
        <Content>
          <div
            className={clsx(
              'mt-6 gap-4 w-full transition-all duration-300 ease-in-out',
              showMore
                ? 'max-h-[520px] overflow-y-auto'
                : 'max-h-[220px] overflow-hidden'
            )}
          >
            {tipList.map((item, index) => (
              <div
                key={item.type + index}
                className={!showMore && index >= 3 ? 'hidden' : ''}
              >
                <Tooltip
                  title={item.tipI18nKey ? t(item.tipI18nKey) : undefined}
                  overlayClassName="rectangle"
                >
                  <Item
                    bgColor="var(--r-neutral-card2, #F2F4F7)"
                    px={16}
                    py={20}
                    leftIcon={item.logo}
                    leftIconClassName="w-6 h-6 mr-12"
                    disabled={item.preventClick}
                    onClick={() => {
                      if (!item.preventClick) {
                        gotoImport(item.type, item.brand);
                      }
                    }}
                    className="rounded-[8px] text-[17px] font-medium text-r-neutral-title1"
                  >
                    {item.brand || BRAND_ALIAN_TYPE_TEXT[item.type]}
                  </Item>
                </Tooltip>
              </div>
            ))}
          </div>

          {!showMore && (
            <div
              onClick={() => setShowMore(true)}
              className="mt-4 flex justify-center items-center gap-2 cursor-pointer text-13 text-r-neutral-foot"
            >
              <span>More</span>
              <RcIconArrowDownCC className="w-[12px] h-[12px]" />
            </div>
          )}
        </Content>
      </Container>
    </UiProvider>
  );
};
