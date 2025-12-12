import { useThemeMode } from '@/ui/hooks/usePreference';
import { useRequest } from 'ahooks';
import { message, Switch } from 'antd';
import { ConnectedSite } from 'background/service/permission';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Empty, FallbackSiteLogo, PageHeader } from 'ui/component';
import { useWallet } from 'ui/utils';

const DappCard = (props: {
  data: ConnectedSite;
  onRemove: (site: ConnectedSite) => void;
}) => {
  const { data, onRemove } = props;
  return (
    <div
      className="
    flex items-center 
    bg-r-neutral-card-1 
    rounded-[6px] 
    py-[14px] pr-[16px] pl-[18px]
    gap-[12px]
    mb-[12px]
  "
    >
      <FallbackSiteLogo
        className="w-[24px] h-[24px] shrink-0"
        url={data.icon}
        origin={data?.origin}
        width="24px"
      />
      <div className="truncate flex-1 text-[13px] leading-[15px] font-medium text-r-neutral-title1">
        {data.origin}
      </div>
      <div className="mr-auto shrink-0">
        <Switch
          className="bg-r-blue-default"
          defaultChecked
          onChange={(v) => {
            if (!v) {
              onRemove(data);
            }
          }}
        ></Switch>
      </div>
    </div>
  );
};

export const MetamaskModeDappsList = () => {
  const wallet = useWallet();
  const { t } = useTranslation();
  const { isDarkTheme } = useThemeMode();

  const { data: sites, runAsync } = useRequest(() =>
    wallet.getMetamaskModeSites()
  );
  const handleRemoveMetamaskMode = async (site: ConnectedSite) => {
    await wallet.removeMetamaskModeSite(site);
    runAsync();
    message.success(t('global.Deleted'));
  };

  return (
    <div
      className="
    flex flex-col 
    px-[20px] pb-[20px] 
    text-[12px] leading-[14px] 
    h-screen overflow-auto 
    bg-r-neutral-bg-2 
  "
    >
      <header className="font-normal text-[14px] leading-[18px] text-r-neutral-body my-[18px]">
        <PageHeader canBack={true}>
          {t('page.metamaskModeDapps.title')}
        </PageHeader>
      </header>
      {sites?.length ? (
        <div className="flex-1 overflow-auto pb-[80px]">
          {(sites || []).map((item) => {
            return (
              <DappCard
                data={item}
                key={item.origin}
                onRemove={handleRemoveMetamaskMode}
              />
            );
          })}
        </div>
      ) : (
        <Empty
          desc={t('page.preferMetamaskDapps.empty')}
          className="mt-[180px]"
        />
      )}
    </div>
  );
};
