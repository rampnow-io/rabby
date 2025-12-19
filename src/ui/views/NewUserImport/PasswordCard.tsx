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
  Checkbox,
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
    <Card onBack={onBack} className="flex flex-col px-5 pb-5">
      <Form {...form}>
        <form className="flex flex-col flex-1 px-5" onSubmit={handleSubmit}>
          <div className="flex-1 mt-[18px]">
            <hgroup className="mb-[24px]">
              <h1 className="text-r-neutral-title1 text-center font-semibold text-[28px] leading-[29px] mb-[9px]">
                {t('page.newUserImport.PasswordCard.title')}
              </h1>

              <p className="text-center text-primary-foreground font-normal text-[16px] leading-[20px] mx-7">
                {t('page.newUserImport.PasswordCard.desc')}
              </p>
            </hgroup>
            <div className="flex flex-col gap-3">
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
          </div>

          {/* Footer */}
          <footer className="mt-auto">
            {/* Submit button */}
            <Button type="submit" disabled={isDisabled} className="w-full">
              {t('global.Confirm')}
            </Button>
          </footer>
        </form>
      </Form>
    </Card>
  );
};
