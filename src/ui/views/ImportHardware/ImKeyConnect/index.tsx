import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StrayPageWithButton } from 'ui/component';
import { hasConnectedImKeyDevice } from '@/ui/utils';
import { HARDWARE_KEYRING_TYPES } from 'consts';
import { query2obj } from '@/ui/utils/url';
import { withHardwareImportSelectAddressSource } from '@/ui/views/SelectAddress/route';

export const ImKeyConnect = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const { search } = useLocation();

  const qs = query2obj(search);
  const isReconnect = !!qs.reconnect;

  const onSubmit = async () => {
    const hasConnectedImKey = await hasConnectedImKeyDevice();

    if (isReconnect) {
      history.push({
        pathname: '/request-permission',
        search: '?type=imkey&reconnect=1',
      });
      return;
    }

    if (hasConnectedImKey) {
      history.push({
        pathname: '/import/select-address',
        state: {
          keyring: HARDWARE_KEYRING_TYPES.ImKey.type,
        },
        search: withHardwareImportSelectAddressSource(
          `?hd=${HARDWARE_KEYRING_TYPES.ImKey.type}`
        ),
      });
    } else {
      history.push({
        pathname: '/request-permission',
        search: '?type=imkey',
      });
    }
  };

  return (
    <StrayPageWithButton
      header={{
        title: t('page.newAddress.imkey.title'),
        center: true,
      }}
      className="max-w-[1000px] mx-auto px-[20px]"
      backgroundClassName="bg-r-neutral-card2"
      headerClassName="mb-40 text-r-neutral-title1"
      onSubmit={onSubmit}
      hasBack={false}
      footerFixed={false}
    >
      <div className="w-[306px] mx-auto">
        <ul className="mb-[50px] pl-[5px] text-[14px] leading-[20px] text-r-neutral-body">
          <li>{t('page.dashboard.hd.imkey.doc1')}</li>
          <li>{t('page.dashboard.hd.imkey.doc2')}</li>
        </ul>

        <img src="/images/imkey-plug.svg" className="mb-[50px]" />
      </div>
    </StrayPageWithButton>
  );
};
