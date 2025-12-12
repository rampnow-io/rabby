import { LoadingOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Form, Input } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { KEYRING_CLASS, KEYRING_TYPE, WALLET_BRAND_CATEGORY } from 'consts';
import { isValidAddress } from '@ethereumjs/util';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import IconBack from 'ui/assets/icon-back.svg';
import IconGnosis from 'ui/assets/walletlogo/safe.svg';
import { useWallet } from 'ui/utils';
import { useRepeatImportConfirm } from '@/ui/utils/useRepeatImportConfirm';
import { safeJSONParse } from '@/utils';
import clsx from 'clsx';
import { UI_TYPE } from '@/constant/ui';
import qs from 'qs';
import { Button } from '@repo/ui/primitives';

const ImportGnosisAddress: React.FC<{ isInModal?: boolean }> = ({
  isInModal,
}) => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();

  const [errorMessage, setErrorMessage] = useState('');

  const [form] = useForm();
  const { show, contextHolder } = useRepeatImportConfirm();
  const { data: chainList, runAsync, error, loading } = useRequest(
    async (address: string) => {
      const res = await wallet.fetchGnosisChainList(address);
      if (!res.length) {
        throw new Error('This address is not a valid safe address');
      }
      return res;
    },
    {
      manual: true,
      debounceWait: 500,
      onBefore() {
        form.setFields([
          {
            name: ['address'],
            errors: [],
          },
        ]);
      },
      onError(e) {
        setErrorMessage(e.message);
      },
      onSuccess() {
        setErrorMessage('');
      },
    }
  );

  const { runAsync: handleNext } = useRequest(wallet.importGnosisAddress, {
    manual: true,
    async onSuccess(accounts) {
      if (UI_TYPE.isDesktop) {
        history.replace({
          pathname: history.location.pathname,
          search: `?${qs.stringify({
            action: 'add-address',
            import: 'success',
          })}`,
          state: {
            accounts,
            title: t('Added successfully'),
            editing: true,
            importedAccount: true,
            importedLength: (
              await wallet.getTypedAccounts(KEYRING_TYPE.GnosisKeyring)
            )?.[0]?.accounts?.length,
            supportChainList: chainList,
          },
        });
      } else {
        history.replace({
          pathname: '/popup/import/success',
          state: {
            accounts,
            title: t('Added successfully'),
            editing: true,
            importedAccount: true,
            importedLength: (
              await wallet.getTypedAccounts(KEYRING_TYPE.GnosisKeyring)
            )?.[0]?.accounts?.length,
            supportChainList: chainList,
          },
        });
      }
    },
    onError(err) {
      if (err.message?.includes?.('DuplicateAccountError')) {
        const address = safeJSONParse(err.message)?.address;
        show({
          address,
          type: KEYRING_CLASS.GNOSIS,
        });
      } else {
        setErrorMessage(err?.message || t('Not a valid address'));
      }
    },
  });

  return (
    <div
      className={clsx(
        'overflow-auto bg-r-neutral-bg-2 h-full relative',
        isInModal ? 'h-[600px] overflow-auto' : ''
      )}
    >
      {contextHolder}
      <header className="bg-r-blue-default h-[180px] relative dark:bg-r-blue-disable">
        <div className="flex flex-col pt-[40px] px-[20px]">
          <img
            src={IconBack}
            className="mb-0 absolute z-10 top-[20px] left-[20px] cursor-pointer"
            onClick={() => {
              history.goBack();
              sessionStorage.setItem(
                'SELECTED_WALLET_TYPE',
                WALLET_BRAND_CATEGORY.INSTITUTIONAL
              );
            }}
          />
          <img
            className="border border-white rounded-full w-[60px] h-[60px] mb-[16px] mx-auto"
            src={IconGnosis}
          />
          <p className="text-[17px] leading-[20px] mt-0 text-white text-center font-bold">
            {t('page.importSafe.title')}
          </p>
        </div>
      </header>
      <div className="flex flex-col px-[20px]">
        <div className="relative p-20">
          <Form
            form={form}
            onValuesChange={(changedValues) => {
              const value = changedValues.address;
              if (!value) {
                setErrorMessage(t('page.importSafe.error.required'));
                return;
              }
              if (!isValidAddress(value)) {
                setErrorMessage(t('page.importSafe.error.invalid'));
                return;
              }
              runAsync(value);
            }}
          >
            <Form.Item
              name="address"
              className="mb-0"
              validateStatus={errorMessage ? 'error' : undefined}
              getValueFromEvent={(e) => {
                const value = e.target.value;
                if (
                  value.includes(':') &&
                  isValidAddress(value.split(':')[1])
                ) {
                  return value.split(':')[1];
                }
                return value;
              }}
            >
              <Input.TextArea
                className="leading-normal"
                autoSize
                size="large"
                autoFocus
                placeholder={t('page.importSafe.placeholder')}
                autoComplete="off"
              />
            </Form.Item>
          </Form>
          {loading ? (
            <div className="mt-[20px] text-[13px] leading-[15px] text-r-neutral-body flex items-center gap-[4px]">
              <LoadingOutlined /> {t('page.importSafe.loading')}
            </div>
          ) : (
            <>
              {errorMessage ? (
                <div className="mt-[12px] text-[13px] leading-[15px] text-[#ec5151]">
                  {errorMessage}
                </div>
              ) : (
                !!chainList?.length && (
                  <div className="mt-[16px] p-[12px] rounded-[6px] bg-r-neutral-card-2">
                    <div className="desc">
                      {t('page.importSafe.gnosisChainDesc', {
                        count: chainList?.length,
                      })}
                    </div>
                    <div className="flex flex-wrap gap-y-[20px] gap-x-[12px]">
                      {chainList?.map((chain) => {
                        return (
                          <div
                            className="flex items-center gap-[6px] text-[13px] font-medium text-r-neutral-title1"
                            key={chain.id}
                          >
                            <img
                              src={chain.logo}
                              alt=""
                              className="w-[20px] h-[20px] rounded-full"
                            />
                            {chain.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 p-[20px] border-t border-r-neutral-line bg-r-neutral-card-1">
        <Button
          className="w-full h-[42px] disabled:bg-[#8998ff] disabled:opacity-40 disabled:rounded-[6px]"
          disabled={loading || !!errorMessage || !chainList?.length}
          onClick={() =>
            handleNext(
              form.getFieldValue('address'),
              (chainList || []).map((chain) => chain.network)
            )
          }
        >
          {t('global.next')}
        </Button>
      </footer>
    </div>
  );
};

export default ImportGnosisAddress;
