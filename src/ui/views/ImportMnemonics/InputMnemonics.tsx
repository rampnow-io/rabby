import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '@repo/ui/primitives/form';
import { Input } from '@repo/ui/primitives';
import { Button } from '@repo/ui/primitives';

import WordsMatrix from '@/ui/component/WordsMatrix';
import { useWallet, getUiType } from '@/ui/utils';
import { clearClipboard } from '@/ui/utils/clipboard';
import { KEYRING_CLASS } from '@/constant';
import { connectStore, useRabbyDispatch } from '../../store';
import { UiProvider } from '@/ui/component/NewUserImport';
import SectionHeader from '@/ui/component/section-header/section-header';
import { Container, Content, Action } from '@repo/ui';

const importMnemonicSchema = z.object({
  mnemonics: z.string().min(1, 'Seed phrase is required'),
  passphrase: z.string().optional(),
});

type ImportMnemonicForm = z.infer<typeof importMnemonicSchema>;

const ImportMnemonics = () => {
  const history = useHistory();
  const wallet = useWallet();
  const dispatch = useRabbyDispatch();
  const { t } = useTranslation();

  const [needPassphrase, setNeedPassphrase] = useState(false);
  const [isSlip39, setIsSlip39] = useState(false);
  const [slip39GroupNumber, setSlip39GroupNumber] = useState(1);
  const [slip39ErrorIndex, setSlip39ErrorIndex] = useState<number>(-1);
  const [secretShares, setSecretShares] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  let keyringId: number | null;

  const form = useForm<ImportMnemonicForm>({
    resolver: zodResolver(importMnemonicSchema),
    defaultValues: {
      mnemonics: '',
      passphrase: '',
    },
  });

  // popup safety
  if (getUiType().isPop) {
    history.replace('/dashboard');
    return null;
  }

  const checkSlip39Mnemonics = useCallback(
    async (mnemonics: string) => {
      if (!isSlip39) return;

      const shares = mnemonics.split('\n').filter(Boolean);
      setSecretShares(shares);

      try {
        const threshold = await wallet.slip39GetThreshold(shares);
        setSlip39GroupNumber(threshold);

        form.setValue('mnemonics', shares.slice(0, threshold).join('\n'));
      } catch (e) {
        console.log('slip39 error', e);
      }
    },
    [isSlip39]
  );

  const onSubmit = async (values: ImportMnemonicForm) => {
    try {
      setLoading(true);

      const { mnemonics, passphrase } = values;

      if (isSlip39) {
        const shares = mnemonics.split('\n').filter(Boolean);
        for (let i = 0; i < shares.length; i++) {
          try {
            await wallet.slip39DecodeMnemonic(shares[i]);
          } catch (err: any) {
            setSlip39ErrorIndex(i);
            throw new Error(err.message);
          }
        }
      }

      const {
        keyringId: stashKeyringId,
        isExistedKR,
      } = await wallet.generateKeyringWithMnemonic(mnemonics, passphrase || '');

      dispatch.importMnemonics.switchKeyring({
        finalMnemonics: mnemonics,
        passphrase,
        isExistedKeyring: isExistedKR,
        stashKeyringId,
      });

      const accounts = await dispatch.importMnemonics.getAccounts({
        start: 0,
        end: 1,
      });
      await dispatch.importMnemonics.setSelectedAccounts([accounts[0].address]);
      await dispatch.importMnemonics.confirmAllImportingAccountsAsync();

      keyringId = stashKeyringId;
      clearClipboard();

      history.push({
        pathname: '/new-user/success',
        search: `?hd=${KEYRING_CLASS.MNEMONIC}&keyringId=${keyringId}&isCreated=false`,
      });
    } catch (err: any) {
      form.setError('mnemonics', {
        message:
          err?.message ||
          t('page.newAddress.theSeedPhraseIsInvalidPleaseCheck'),
      });
    } finally {
      setLoading(false);
    }
  };

  const disabledButton = isSlip39 && secretShares.length < slip39GroupNumber;

  return (
    <UiProvider>
      <Container>
        <SectionHeader
          className="flex flex-col items-center"
          title={t('page.newUserImport.importSeedPhrase.title')}
        />

        <Content>
          <Form {...form}>
            <FormField
              control={form.control}
              name="mnemonics"
              render={({ field }) => (
                <FormItem className="mb-6">
                  <FormControl>
                    <WordsMatrix.MnemonicsInputs
                      {...field}
                      newUserImport
                      isSlip39={isSlip39}
                      slip39GroupNumber={slip39GroupNumber}
                      onSlip39Change={setIsSlip39}
                      onPassphrase={setNeedPassphrase}
                      onChange={checkSlip39Mnemonics}
                      setSlip39GroupNumber={setSlip39GroupNumber}
                      errorIndexes={[slip39ErrorIndex]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {needPassphrase && (
              <FormField
                control={form.control}
                name="passphrase"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('page.newAddress.seedPhrase.passphrase')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </Form>
        </Content>
        <Action>
          <Button
            onSubmit={form.handleSubmit(onSubmit)}
            disabled={disabledButton}
            className="mt-auto h-[56px] w-full rounded-[8px]"
          >
            {t('global.confirm')}
          </Button>
        </Action>
      </Container>
    </UiProvider>
  );
};

export default connectStore()(ImportMnemonics);
