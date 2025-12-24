import { UiProvider } from '@/ui/component/NewUserImport';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useNewUserGuideStore } from './hooks/useNewUserGuideStore';
import { clearClipboard } from '@/ui/utils/clipboard';
import IconSuccess from 'ui/assets/success.svg';
import styled from 'styled-components';
import { useWallet } from '@/ui/utils';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
} from '@repo/ui/primitives';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { message } from 'antd';
import { Action, Content } from '@repo/ui';
import { HeaderNavPage } from '@/ui/component';
import SectionHeader from '@/ui/component/section-header/section-header';

const Container = styled.div`
  input {
    border-radius: 8px;
    border: 1px solid var(--r-neutral-line, #e0e5ec);
    font-size: 16px;

    &:not(:placeholder-shown) {
      font-size: 24px;
    }

    &::placeholder {
      color: var(--r-neutral-foot, #6a7587);
      font-weight: 400;
    }

    &:focus {
      border-color: var(--r-blue-default, #7084ff);
      border-width: 1.5px;
    }
  }
`;

export const NewUserImportPrivateKey = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();
  const { setStore, clearStore } = useNewUserGuideStore();

  /* ---------------- schema ---------------- */
  const formSchema = z.object({
    privateKey: z
      .string()
      .min(1, 'Please input Private key')
      .refine(
        async (value) => {
          return wallet.validatePrivateKey(value);
        },
        {
          message: 'Invalid private key',
        }
      ),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      privateKey: '',
    },
  });

  const {
    handleSubmit,
    watch,
    formState: { isSubmitting, isValid },
  } = form;

  const privateKeyValue = watch('privateKey');

  /* ---------------- submit ---------------- */
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setStore({
      privateKey: values.privateKey,
    });

    history.push('/new-user/import/private-key/set-password');
  };

  return (
    <UiProvider>
      <Container>
        <HeaderNavPage
          handleBack={() => {
            history.goBack();
            clearStore();
          }}
        />
        <SectionHeader
          className="text-center"
          title={t('page.newUserImport.importPrivateKey.title')}
        />

        <Content>
          <Form {...form}>
            <form className="mt-[20px]">
              <FormField
                control={form.control}
                name="privateKey"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-[52px]"
                        type="password"
                        autoFocus
                        spellCheck={false}
                        placeholder="Input private key"
                        onPaste={() => {
                          clearClipboard();
                          message.success({
                            icon: (
                              <img
                                src={IconSuccess}
                                className="icon icon-success"
                              />
                            ),
                            content: t(
                              'page.newUserImport.importPrivateKey.pasteCleared'
                            ),
                            duration: 2,
                          });
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
            disabled={!isValid || isSubmitting || !privateKeyValue}
            className="mt-auto text-[17px] font-medium"
          >
            {t('global.Confirm')}
          </Button>
        </Action>
      </Container>
    </UiProvider>
  );
};
