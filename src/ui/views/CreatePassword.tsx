'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { useWallet, useWalletRequest, openInTab } from 'ui/utils';
import UnlockLogo from 'ui/assets/unlock-logo.svg';
import IconCheck from 'ui/assets/check.svg';
import clsx from 'clsx';
import remarkGfm from 'remark-gfm';
import TermOfUse from '@/constant/term-of-use.md';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/primitives';

const MINIMUM_PASSWORD_LENGTH = 8;

const schema = z
  .object({
    password: z.string().min(MINIMUM_PASSWORD_LENGTH, 'Password is too short'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export default function CreatePassword() {
  const history = useHistory();
  const location = useLocation<{ handle: (h: typeof history) => void }>();
  const { t } = useTranslation();
  const wallet = useWallet();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const { watch } = form;

  const [run, loading] = useWalletRequest(wallet.boot, {
    onSuccess() {
      const { handle } = location.state || {};
      handle?.(history);
    },
    onError(err) {
      form.setError('password', {
        message: err?.message || t('incorrect password'),
      });
    },
  });

  const init = async () => {
    if ((await wallet.isBooted()) && !(await wallet.isUnlocked())) {
      history.replace('/unlock');
      return;
    }

    const currentAccount = await wallet.getCurrentAccount();
    if ((await wallet.isBooted()) && !currentAccount) {
      history.replace('/no-address');
      return;
    }
  };

  useEffect(() => {
    init();
  }, []);

  // Terms agree toggle
  const [agreeTerm, setAgreeTerm] = useState(false);
  const [visible, setVisible] = useState(false);

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const disable =
    !agreeTerm ||
    !password ||
    !confirmPassword ||
    password.length < MINIMUM_PASSWORD_LENGTH ||
    password !== confirmPassword;

  const gotoTermsOfUse = () => openInTab('https://rabby.io/docs/terms-of-use');
  const gotoPrivacy = () => openInTab('https://rabby.io/docs/privacy');

  const onSubmit = ({ password }: z.infer<typeof schema>) => {
    run(password.trim());
  };

  return (
    <div className="h-full bg-r-neutral-card2 flex flex-col relative">
      {loading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="animate-spin h-8 w-8 border-2 border-white rounded-full border-t-transparent" />
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full">
          <header className="create-new-header create-password-header h-[234px]">
            <img
              src={UnlockLogo}
              className="unlock-logo w-[100px] h-[100px] mx-auto mb-[16px]"
            />
            <p className="text-24 mb-8 text-r-neutral-title2 text-center font-bold">
              {t('page.createPassword.title')}
            </p>
            <p className="text-13 text-center text-r-neutral-title2 opacity-80">
              It will be used to unlock your wallet and encrypt local data
            </p>

            <img src="/images/create-password-mask.png" className="mask" />
          </header>

          <div className="p-32 min-h-[232px] max-h-[232px] overflow-hidden">
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem className="mb-0">
                  <FormControl>
                    <Input
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      type="password"
                      className="h-[52px]"
                      placeholder={t('page.createPassword.passwordPlaceholder')}
                      autoComplete="new-password"
                      inputMode="text"
                      spellCheck={false}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              name="confirmPassword"
              control={form.control}
              render={({ field }) => (
                <FormItem className="mb-0 mt-3">
                  <FormControl>
                    <Input
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      type="password"
                      className="h-[52px]"
                      placeholder={t('page.createPassword.confirmPlaceholder')}
                      autoComplete="new-password"
                      inputMode="text"
                      spellCheck={false}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div
            className="flex justify-center mb-[24px] cursor-pointer mx-32"
            onClick={(e) => {
              e.preventDefault();
              setAgreeTerm(!agreeTerm);
            }}
          >
            <div
              className={clsx(
                'w-[15px] h-[15px] mr-[6px] flex items-center justify-center rounded-full pointer-events-none',
                agreeTerm ? 'bg-r-blue-default' : 'bg-r-neutral-foot'
              )}
            >
              {agreeTerm && <img src={IconCheck} className="w-[10px]" />}
            </div>

            <span className="text-[13px] text-r-neutral-body">
              <Trans t={t} i18nKey="page.createPassword.agree">
                have read and agree to the{' '}
                <span
                  className="text-r-blue-default"
                  onClick={(e) => {
                    e.stopPropagation();
                    gotoTermsOfUse();
                  }}
                >
                  Terms of Use
                </span>{' '}
                and{' '}
                <span
                  className="text-r-blue-default"
                  onClick={(e) => {
                    e.stopPropagation();
                    gotoPrivacy();
                  }}
                >
                  Privacy Policy
                </span>
              </Trans>
            </span>
          </div>

          <div className="p-32 pt-0">
            <Button disabled={disable} className="w-full">
              Next
            </Button>
          </div>
        </form>
      </Form>

      <Sheet open={visible} onOpenChange={setVisible}>
        <SheetContent side="bottom" className="h-[580px] rounded-t-2xl p-6">
          <SheetHeader>
            <SheetTitle className="text-center">Rabby Terms of Use</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
}
