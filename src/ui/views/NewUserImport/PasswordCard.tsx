'use client';

import { Card } from '@/ui/component/NewUserImport';
import { openInTab } from '@/ui/utils';
import { useMemoizedFn } from 'ahooks';
import clsx from 'clsx';
import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { sum } from 'lodash';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { ReactComponent as RcIconCheckCC } from 'ui/assets/IconCheckedSquare.svg';
import { ReactComponent as RcIconSuccessCC } from 'ui/assets/icon-checked-success-cc.svg';
import { ReactComponent as RcIconUnCheckCC } from 'ui/assets/IconUncheckSquare.svg';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
} from '@repo/ui/primitives';

const MINIMUM_PASSWORD_LENGTH = 8;
const passwordSchema = z
  .object({
    password: z.string().min(MINIMUM_PASSWORD_LENGTH, 'Password is too short'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

interface Props {
  onSubmit?(password: string): void;
  onBack?(): void;
  step: 1 | 2;
}

export const PasswordCard: React.FC<Props> = ({ onSubmit, onBack, step }) => {
  const { t } = useTranslation();
  const [agreeTerm, setAgreeTerm] = useState(true);

  // React Hook Form
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit?.(values.password);
  });

  const gotoTermsOfUse = useMemoizedFn(() => {
    openInTab('https://rabby.io/docs/terms-of-use', false);
  });

  const gotoPrivacy = useMemoizedFn(() => {
    openInTab('https://rabby.io/docs/privacy', false);
  });

  const isDisabled =
    !agreeTerm || !form.formState.isValid || !form.formState.isDirty;

  return (
    <Card onBack={onBack} step={step} className="flex flex-col">
      <Form {...form}>
        <form className="flex flex-col flex-1" onSubmit={handleSubmit}>
          <div className="flex-1 mt-[18px]">
            <hgroup className="mb-[24px]">
              <h1 className="text-r-neutral-title1 text-center font-semibold text-[28px] leading-[29px] mb-[9px]">
                {t('page.newUserImport.PasswordCard.title')}
              </h1>

              <p className="text-center text-rabby-blue-default font-normal text-[16px] leading-[20px] mx-28">
                {t('page.newUserImport.PasswordCard.desc')}
              </p>
            </hgroup>

            {/* Password */}
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="password"
                        placeholder={t(
                          'page.newUserImport.PasswordCard.form.password.placeholder'
                        )}
                      />

                      {/* Success icon */}
                      {form.watch('password') &&
                        !form.formState.errors.password && (
                          <span className="absolute right-3 top-[14px] text-r-green-default">
                            <RcIconSuccessCC />
                          </span>
                        )}
                    </div>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              name="confirmPassword"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="password"
                        placeholder={t(
                          'page.newUserImport.PasswordCard.form.confirmPassword.placeholder'
                        )}
                      />

                      {form.watch('confirmPassword') &&
                        !form.formState.errors.confirmPassword && (
                          <span className="absolute right-3 top-[14px] text-r-green-default">
                            <RcIconSuccessCC />
                          </span>
                        )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Footer */}
          <footer className="mt-auto">
            {/* Terms checkbox */}
            <div
              className="flex items-center justify-center gap-[4px] cursor-pointer"
              onClick={() => setAgreeTerm((prev) => !prev)}
            >
              {agreeTerm ? (
                <div className="text-rabby-blue-default">
                  <RcIconCheckCC className="w-[18px] h-[18px]" />
                </div>
              ) : (
                <div className="text-r-neutral-foot">
                  <RcIconUnCheckCC className="w-[18px] h-[18px]" />
                </div>
              )}

              <div className="text-[13px] text-r-neutral-body leading-[16px]">
                <Trans t={t} i18nKey="page.newUserImport.PasswordCard.agree">
                  I agree to the{' '}
                  <span
                    className="text-rabby-blue-default font-medium cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      gotoTermsOfUse();
                    }}
                  >
                    Terms of Use
                  </span>
                  and
                  <span
                    className="text-rabby-blue-default font-medium cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      gotoPrivacy();
                    }}
                  >
                    Privacy Policy
                  </span>
                </Trans>
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isDisabled}
              className={clsx('w-full ')}
            >
              {t('global.Confirm')}
            </Button>
          </footer>
        </form>
      </Form>
    </Card>
  );
};
