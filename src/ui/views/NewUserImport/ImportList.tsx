import React, { useState } from 'react';
import clsx from 'clsx';
import { IconPrivateKey, IconSeedPhrase } from '@/ui/assets';
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
import { Card } from '@repo/ui/primitives';

export const ImportWalletList = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const [showMore, setShowMore] = useState(false);

  const tipList = React.useMemo(
    () => [
      {
        type: KEYRING_TYPE.HdKeyring,
        logo: IconSeedPhrase,
        title: 'Import Recovery Phrase',
      },
      {
        type: KEYRING_TYPE.SimpleKeyring,
        logo: IconPrivateKey,
        title: 'Import Private Key',
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
        >
          <div className="text-primary-foreground text-xl font-medium">
            {t('page.newUserImport.importList.title')}
          </div>
        </HeaderNavPage>
        <Content>
          {tipList.map((item, index) => (
            <div key={item.type + index} className="flex flex-col gap-4 mt-6">
              <Card className="w-full rounded-[16px] cursor-pointer border-none bg-[#FAFAFA] p-4 flex gap-4 justify-between items-start">
                <div
                  className="gap-4 flex items-center"
                  onClick={() => gotoImport(item.type, item.brand)}
                >
                  <div className="bg-[#c3f53c] h-11 w-11 rounded-[50%] flex items-center justify-center flex-shrink-0">
                    {item.logo && typeof item.logo !== 'string' ? (
                      React.createElement(item.logo, { className: 'w-6 h-6' })
                    ) : (
                      <img
                        src={item.logo}
                        alt={item.type}
                        className="w-6 h-6"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-base font-medium text-primary-foreground">
                      {item.title
                        ? item.title
                        : item.brand ||
                          BRAND_ALIAN_TYPE_TEXT[item.type] ||
                          item.type}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </Content>
      </Container>
    </UiProvider>
  );
};
