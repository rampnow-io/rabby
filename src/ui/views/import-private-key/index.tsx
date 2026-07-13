import { HeaderNavPage } from '@/ui/component';
import { UIContainer } from '@/ui/provider';
import { useWallet, useWalletRequest } from '@/ui/utils';
import { useRepeatImportConfirm } from '@/ui/utils/useRepeatImportConfirm';
import { Action, Container, Content } from '@repo/ui';
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useMedia } from 'react-use';
import { useForm } from 'react-hook-form';
import { Copy as CopyIcon, Clipboard } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Button,
} from '@repo/ui/primitives';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { clearClipboard } from '@/ui/utils/clipboard';
import { safeJSONParse } from '@/utils';
import { KEYRING_CLASS, KEYRING_TYPE } from '@/constant';
import IconSuccess from 'ui/assets/success.svg';
import { C } from 'ts-toolbelt';

const importPrivateKeySchema = z.object({
  key: z.string().min(1, 'Private key is required'),
});

type ImportPrivateKeyForm = z.infer<typeof importPrivateKeySchema>;

const ImportPrivateKeyPage = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const wallet = useWallet();
  const isWide = useMedia('(min-width: 401px)');
  const { show, contextHolder } = useRepeatImportConfirm();

  const [importedAccountsLength, setImportedAccountsLength] = useState(0);

  const form = useForm<ImportPrivateKeyForm>({
    resolver: zodResolver(importPrivateKeySchema),
    defaultValues: { key: '' },
  });

  const [run, loading] = useWalletRequest(wallet.importPrivateKey, {
    onSuccess(accounts) {
      clearClipboard();
      history.push('/dashboard');
    },

    onError(err) {
      if (err.message?.includes?.('DuplicateAccountError')) {
        const address = safeJSONParse(err.message)?.address;
        show({
          address,
          type: KEYRING_CLASS.PRIVATE_KEY,
        });
      } else {
        form.setError('key', {
          message:
            err?.message || t('page.newAddress.privateKey.notAValidPrivateKey'),
        });
      }
    },
  });

  useEffect(() => {
    (async () => {
      const imported = await wallet.getTypedAccounts(
        KEYRING_TYPE.SimpleKeyring
      );
      setImportedAccountsLength(imported.length);

      if (await wallet.hasPageStateCache()) {
        const cache = await wallet.getPageStateCache();
        if (cache && cache.path === history.location.pathname) {
          form.reset(cache.states);
        }
      }
    })();

    return () => {
      wallet.clearPageStateCache();
    };
  }, []);

  const watchedValues = form.watch();

  useEffect(() => {
    wallet.setPageStateCache({
      path: '/import/key',
      params: {},
      states: watchedValues,
    });
  }, [watchedValues]);

  return (
    <UIContainer>
      {contextHolder}

      <Container>
        <HeaderNavPage
          handleBack={() =>
            history.length > 1 ? history.goBack() : history.replace('/')
          }
        >
          <div className="text-primary-foreground text-xl font-normal">
            {t('page.newAddress.importPrivateKey')}
          </div>
        </HeaderNavPage>

        <Content>
          <div className="flex flex-col gap-4">
            <Form {...form}>
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoFocus
                        spellCheck={false}
                        placeholder={'Enter a recovery phrase or private key'}
                        className="h-[52px] px-4"
                        onPaste={() => {
                          clearClipboard();
                          window.dispatchEvent(
                            new CustomEvent('toast', {
                              detail: {
                                icon: IconSuccess,
                                message: t(
                                  'page.newAddress.seedPhrase.pastedAndClear'
                                ),
                              },
                            })
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
            <div className="flex justify-center items-center text-primary-foreground text-sm gap-2">
              <p>Paste from Keyboard</p>

              <Clipboard
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    console.log('adasdsad', text);

                    form.setValue('key', text);
                    clearClipboard();
                  } catch (err: any) {
                    if (err?.name === 'NotAllowedError') {
                      window.dispatchEvent(
                        new CustomEvent('toast', {
                          detail: {
                            message:
                              t('page.newAddress.seedPhrase.clipboardDenied') ||
                              'Clipboard access denied. Please paste manually.',
                          },
                        })
                      );
                    } else {
                      console.error('Failed to read clipboard:', err);
                    }
                  }
                }}
              />
            </div>
          </div>
        </Content>

        <Action>
          <Button
            disabled={loading}
            className="w-full"
            onClick={form.handleSubmit((v) => run(v.key))}
          >
            {t('global.confirm')}
          </Button>
        </Action>
      </Container>
    </UIContainer>
  );
};

export default ImportPrivateKeyPage;
