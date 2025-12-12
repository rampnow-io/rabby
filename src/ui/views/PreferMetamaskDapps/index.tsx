import { useRequest } from 'ahooks';
import { message } from 'antd';
import { ConnectedSite } from 'background/service/permission';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReactComponent as RcIconDelete } from 'ui/assets/prefer-metamask-dapps/delete.svg';
import { Empty, FallbackSiteLogo, PageHeader, Popup } from 'ui/component';
import { useWallet } from 'ui/utils';
import contextMenuImage from 'ui/assets/prefer-metamask-dapps/context-menu.png';
import { Button } from '@repo/ui/primitives';

const DappCard = (props: {
  data: ConnectedSite;
  onRemove: (site: ConnectedSite) => void;
}) => {
  const { data, onRemove } = props;
  return (
    <div className="flex items-center gap-[12px] p-[16px] bg-r-neutral-card-1 rounded-[8px] mb-[12px]">
      <FallbackSiteLogo
        className="w-[24px] h-[24px] rounded-full"
        url={data.icon}
        origin={data?.origin}
        width="24px"
      />
      <div className="flex-1 text-[15px] text-r-neutral-title1 truncate">
        {data.origin}
      </div>
      <div className="flex items-center">
        <RcIconDelete
          className="w-[20px] h-[20px] cursor-pointer text-r-neutral-body hover:text-r-red-default transition-colors"
          viewBox="0 0 20 20"
          onClick={() => {
            onRemove(data);
          }}
        ></RcIconDelete>
      </div>
    </div>
  );
};

export const PreferMetamaskDapps = () => {
  const wallet = useWallet();
  const { t } = useTranslation();

  const { data: sites, runAsync } = useRequest(() =>
    wallet.getPreferMetamaskSites()
  );
  const handleRemovePrefeMask = async (site: ConnectedSite) => {
    await wallet.removePreferMetamask(site.origin);
    runAsync();
    message.success(t('global.Deleted'));
  };

  const handleAdd = () => {
    Popup.info({
      title: t('page.preferMetamaskDapps.howToAdd'),
      closable: true,
      className: 'prefer-metamask-popup is-support-darkmode',
      height: 270,
      content: (
        <div className="content">
          <div className="info">
            {t('page.preferMetamaskDapps.howToAddDesc')}
          </div>
          <img src={contextMenuImage} alt="" />
        </div>
      ),
    });
  };

  return (
    <div
      className="
    flex flex-col
    px-[20px] pb-[20px] pt-0
    text-[12px] leading-[14px]
    h-screen overflow-auto
    bg-r-neutral-bg-2
    relative
  "
    >
      <header>
        <PageHeader canBack={false} closeable>
          {t('page.preferMetamaskDapps.title')}
        </PageHeader>
        <div className="font-normal text-[14px] leading-[18px] text-r-neutral-body my-[18px]">
          {t('page.preferMetamaskDapps.desc')}
        </div>
      </header>
      {sites?.length ? (
        <div className="flex-1 overflow-auto pb-[80px]">
          {(sites || []).map((item) => {
            return (
              <DappCard
                data={item}
                key={item.origin}
                onRemove={handleRemovePrefeMask}
              />
            );
          })}
        </div>
      ) : (
        <Empty
          desc={t('page.preferMetamaskDapps.empty')}
          className="mt-[80px]"
        />
      )}
      <footer className="footer">
        <Button onClick={handleAdd}>
          {t('page.preferMetamaskDapps.howToAdd')}
        </Button>
      </footer>
    </div>
  );
};
