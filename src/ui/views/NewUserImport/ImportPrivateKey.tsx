import { UiProvider } from '@/ui/component/NewUserImport';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useNewUserGuideStore } from './hooks/useNewUserGuideStore';
import { clearClipboard } from '@/ui/utils/clipboard';
import IconSuccess from 'ui/assets/success.svg';
import { useWallet } from '@/ui/utils';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import { useForm } from 'react-hook-form';
import {
  Button,
  Input,
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  InputSize,
} from '@repo/ui/primitives';
import { Action, Container, Content } from '@repo/ui';
import { HeaderNavPage } from '@/ui/component';

export const NewUserImportPrivateKey = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();
  const { setStore, clearStore } = useNewUserGuideStore();

  const form = useForm<{ privateKey: string }>({
    mode: 'onBlur',
    defaultValues: {
      privateKey: '',
    },
  });

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  /* ---------- Async validation using useRequest ---------- */
  const { runAsync: validateKey, loading } = useRequest(
    async (value: string) => {
      if (!value) {
        throw new Error('Please input Private key');
      }
      await wallet.validatePrivateKey(value);
      return true;
    },
    {
      manual: true,
    }
  );

  /* ---------- Handle submit ---------- */
  const onSubmit = async (values: { privateKey: string }) => {
    try {
      await validateKey(values.privateKey);
      setStore({
        privateKey: values.privateKey,
      });
      history.push('/new-user/import/private-key/set-password');
    } catch (err: any) {
      form.setError('privateKey', {
        message: err.message,
      });
    }
  };

  return (
    <UiProvider>
      <Container>
        <HeaderNavPage
          handleBack={() => {
            history.goBack();
            clearStore();
          }}
        >
          <div className="text-primary-foreground text-xl font-medium">
            {t('page.newUserImport.importPrivateKey.title')}
          </div>
        </HeaderNavPage>

        <Content>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-[20px]">
              <FormField
                control={control}
                name="privateKey"
                rules={{
                  validate: async (value) => {
                    if (!value) {
                      return 'Please input Private key';
                    }
                    try {
                      await validateKey(value);
                      return true;
                    } catch (err: any) {
                      return err.message;
                    }
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        sizeVariant={InputSize.LG}
                        type="password"
                        autoFocus
                        spellCheck={false}
                        placeholder="Input private key"
                        onPaste={() => {
                          clearClipboard();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </Content>

        <Action>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={!!errors.privateKey}
          >
            {t('global.Confirm')}
          </Button>
        </Action>
      </Container>
    </UiProvider>
  );
};
