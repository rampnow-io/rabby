import React, { useState } from 'react';
import clsx from 'clsx';
import styled from 'styled-components';
import { LoadingOutlined } from '@ant-design/icons';
import { Form, Input } from 'antd';
import { isValidAddress } from '@ethereumjs/util';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useMemoizedFn, useMount, useRequest } from 'ahooks';

import { useWallet } from '@/ui/utils';
import { useNewUserGuideStore } from './hooks/useNewUserGuideStore';
import { GnosisChainList } from './GnosisChainList';
import { Chain as LocalChain } from '@/types/chain';

import { UiProvider } from '@/ui/component/NewUserImport';
import { Container as PageContainer, Content, Action } from '@repo/ui';
import { HeaderNavPage } from '@/ui/component';
import SectionHeader from '@/ui/component/section-header/section-header';
import { Button } from '@repo/ui/primitives';

/* ---------------- STYLES ---------------- */

/* ---------------- COMPONENT ---------------- */

export const NewUserImportGnosisAddress = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();

  const { store, setStore, clearStore } = useNewUserGuideStore();

  const [errorMessage, setErrorMessage] = useState('');

  const [form] = Form.useForm<{
    address: string;
  }>();

  /* ---------------- FETCH CHAINS ---------------- */

  const { data: chainList, runAsync, loading } = useRequest(
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
        form.setFields([{ name: ['address'], errors: [] }]);
      },
      onSuccess() {
        setErrorMessage('');
      },
      onError(e: any) {
        setErrorMessage(e.message);
      },
    }
  );

  /* ---------------- NEXT ---------------- */

  const handleNext = useMemoizedFn(() => {
    const { address } = form.getFieldsValue();

    setStore({
      gnosis: {
        address,
        chainList: (chainList || []) as LocalChain[],
      },
    });

    history.push('/new-user/import/gnosis-address/set-password');
  });

  /* ---------------- INIT ---------------- */

  useMount(() => {
    if (store.gnosis?.address) {
      runAsync(store.gnosis.address);
    }
  });

  /* ---------------- RENDER ---------------- */

  return (
    <UiProvider>
      <PageContainer>
        <HeaderNavPage
          handleBack={() => {
            history.length
              ? history.goBack()
              : history.replace('/new-user/import-list');
            clearStore();
          }}
        />

        <SectionHeader
          className="text-center"
          title={t('page.newUserImport.importSafe.title')}
        />

        <Content>
          <Form
            form={form}
            initialValues={{
              address: store.gnosis?.address,
            }}
            onValuesChange={(changed) => {
              const value = changed.address;

              if (!value) {
                setErrorMessage(
                  t('page.newUserImport.importSafe.error.required')
                );
                return;
              }

              if (!isValidAddress(value)) {
                setErrorMessage(
                  t('page.newUserImport.importSafe.error.invalid')
                );
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
                className="leading-normal h-[100px]"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                autoSize
                autoFocus
                placeholder={t('page.newUserImport.importSafe.placeholder')}
                autoComplete="off"
              />
            </Form.Item>
          </Form>

          {loading && (
            <div className="loading">
              <LoadingOutlined />
              {t('page.newUserImport.importSafe.loading')}
            </div>
          )}

          {!loading && errorMessage && (
            <div className="error">{errorMessage}</div>
          )}

          {!loading && !errorMessage && !!chainList?.length && (
            <GnosisChainList
              chainList={chainList as LocalChain[]}
              className="mt-[20px]"
            />
          )}
        </Content>

        <Action>
          <Button
            onClick={handleNext}
            disabled={!!errorMessage || loading || !chainList?.length}
            className="w-full h-[56px] text-[17px] font-medium"
          >
            {t('global.next')}
          </Button>
        </Action>
      </PageContainer>
    </UiProvider>
  );
};
