'use client';

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

import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@repo/ui/primitives';
import { IconLock } from '@/ui/assets';
import { UiProvider } from '@/ui/component/NewUserImport';
import { Action, Container, Content } from '@repo/ui';
import { HeaderNavPage } from '@/ui/component';
import SectionHeader from '@/ui/component/section-header/section-header';

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
}

export const PasswordCard: React.FC<Props> = ({ onSubmit, onBack }) => {
  const { t } = useTranslation();

  // React Hook Form
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const formSubmit = (values: z.infer<typeof passwordSchema>) => {
    onSubmit?.(values.password);
  };

  return (
    <UiProvider>
      <Container>
        <HeaderNavPage handleBack={onBack} />
        <Content>
          <Form {...form}>
            <div className="flex flex-col items-center gap-6">
              <img
                src={IconLock}
                alt="Rampnow logo"
                className="w-[53px] h-[70px] self-center"
              />

              <SectionHeader
                className="flex flex-col items-center"
                title={t('page.newUserImport.PasswordCard.title')}
                description={t('page.newUserImport.PasswordCard.desc')}
              />

              <div className="flex flex-col w-full gap-3 mt-1">
                <FormField
                  name="password"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t(
                          'page.newUserImport.PasswordCard.form.password.label'
                        )}
                      </FormLabel>

                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="password"
                            placeholder={t(
                              'page.newUserImport.PasswordCard.form.password.placeholder'
                            )}
                          />

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

                <FormField
                  name="confirmPassword"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t(
                          'page.newUserImport.PasswordCard.form.confirmPassword.label'
                        )}
                      </FormLabel>
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
          </Form>
        </Content>
        <Action>
          <Button
            disabled={
              form.watch('password') !== form.watch('confirmPassword') ||
              !form.watch('password')
            }
            onClick={form.handleSubmit(formSubmit)}
            className="w-full"
          >
            {t('global.Confirm')}
          </Button>
        </Action>
      </Container>
    </UiProvider>
  );
};
