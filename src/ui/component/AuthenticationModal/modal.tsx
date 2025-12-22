import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';

import { WrappedComponentProps, wrapModalPromise } from '../Modal/WrapPromise';
import BottomFloatingSheet from '../BottomFloatingPopup';

import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  Input,
} from '@repo/ui/primitives';

interface AuthenticationModalProps extends WrappedComponentProps {
  title?: string;
}

type FormValues = {
  password: string;
};

const AuthenticationModal: React.FC<AuthenticationModalProps> = ({
  onFinished,
  onCancel,
  wallet,
  title,
}) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      password: '',
    },
  });

  const password = form.watch('password');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const closeAndReject = useCallback(() => {
    setVisible(false);
    onCancel();
  }, [onCancel]);

  const handleSubmit = useCallback(
    async (values: FormValues) => {
      try {
        setSubmitting(true);
        await wallet.verifyPassword(values.password);
        setVisible(false);
        onFinished();
      } catch (error) {
        form.setError('password', {
          type: 'manual',
          message:
            (error as { message?: string })?.message ||
            t('component.AuthenticationModal.passwordError'),
        });
      } finally {
        setSubmitting(false);
      }
    },
    [form, onFinished, t, wallet]
  );

  return (
    <BottomFloatingSheet open={visible} onClose={closeAndReject}>
      <div className="mb-4 mt-2 text-center text-[16px] font-medium text-r-neutral-title-1">
        {title || t('component.AuthenticationModal.title')}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            rules={{
              required: t('component.AuthenticationModal.passwordRequired'),
            }}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    ref={inputRef}
                    type="password"
                    spellCheck={false}
                    autoFocus
                    className="h-[56px] rounded-[8px] bg-r-neutral-card1 border-rabby-blue-default"
                    placeholder={t(
                      'component.AuthenticationModal.passwordPlaceholder'
                    )}
                  />
                </FormControl>

                {fieldState.error && (
                  <p className="mt-[4px] text-[12px] text-r-red-default">
                    {fieldState.error.message}
                  </p>
                )}
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={!password?.trim()}
            className="w-full h-[48px]"
          >
            {t('global.confirm')}
          </Button>
        </form>
      </Form>
    </BottomFloatingSheet>
  );
};

const AuthenticationModalPromise = wrapModalPromise<AuthenticationModalProps>(
  AuthenticationModal
);

export default AuthenticationModalPromise;
