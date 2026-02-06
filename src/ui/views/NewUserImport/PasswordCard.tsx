'use client';

import { openInTab } from '@/ui/utils';
import { useMemoizedFn } from 'ahooks';
import clsx from 'clsx';
import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { sum } from 'lodash';
import { Eye, EyeOff } from 'lucide-react';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { ReactComponent as RcIconCheckCC } from 'ui/assets/IconCheckedSquare.svg';

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

// Password strength checker
const getPasswordStrength = (password: string) => {
  if (!password) return null;

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const length = password.length;

  const scoreTotal =
    (hasUpperCase ? 1 : 0) +
    (hasLowerCase ? 1 : 0) +
    (hasNumbers ? 1 : 0) +
    (hasSpecialChar ? 1 : 0) +
    (length >= 12 ? 1 : 0);

  if (scoreTotal <= 2) return { level: 'weak', color: 'text-red-500' };
  if (scoreTotal <= 3) return { level: 'medium', color: 'text-yellow-500' };
  return { level: 'good', color: 'text-green-500' };
};

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
                className="text-center"
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
                        <div className="flex flex-col gap-2">
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? 'text' : 'password'}
                              placeholder={t(
                                'page.newUserImport.PasswordCard.form.password.placeholder'
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-[14px] text-gray-500 hover:text-gray-700"
                            >
                              {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>

                          {form.watch('password') && (
                            <div
                              className={`text-sm font-medium capitalize flex items-center gap-1 ${
                                getPasswordStrength(form.watch('password'))
                                  ?.color
                              }`}
                            >
                              <span className="text-lg">✓</span>
                              {
                                getPasswordStrength(form.watch('password'))
                                  ?.level
                              }
                            </div>
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
                        <div className="flex flex-col gap-2">
                          <div className="relative">
                            <Input
                              {...field}
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder={t(
                                'page.newUserImport.PasswordCard.form.confirmPassword.placeholder'
                              )}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute right-3 top-[14px] text-gray-500 hover:text-gray-700"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
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
