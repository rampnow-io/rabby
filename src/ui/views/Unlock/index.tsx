import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import {
  useWallet,
  useApproval,
  useWalletRequest,
  getUiType,
  openInternalPageInTab,
} from 'ui/utils';
import { BackgroundSVG } from '@/ui/assets';
import qs from 'qs';
import { isString } from 'lodash';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
} from '@repo/ui/primitives';
import { UiProvider } from '@/ui/component/NewUserImport';
import { Action, Container, Content } from '@repo/ui';
import { ResetWalletModal } from './components/reset-wallet';

const unlockSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

type UnlockForm = z.infer<typeof unlockSchema>;

const Unlock = () => {
  const wallet = useWallet();
  const [, resolveApproval] = useApproval();
  const [open, setOpen] = useState(false);
  const UiType = getUiType();
  const { t } = useTranslation();
  const history = useHistory();
  const isUnlockingRef = useRef(false);
  const [hasForgotPassword, setHasForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();
  const query = useMemo(() => {
    return qs.parse(location.search, {
      ignoreQueryPrefix: true,
    });
  }, [location.search]);

  const form = useForm<UnlockForm>({
    resolver: zodResolver(unlockSchema),
    defaultValues: {
      password: '',
    },
  });

  const [run] = useWalletRequest(wallet.unlock, {
    onSuccess() {
      if (UiType.isNotification) {
        if (query.from === '/connect-approval') {
          history.replace('/approval?ignoreOtherWallet=1');
        } else {
          resolveApproval();
        }
      } else if (UiType.isTab || UiType.isDesktop) {
        history.replace(query.from && isString(query.from) ? query.from : '/');
      } else {
        history.replace('/');
      }
    },
    onError(err) {
      console.log('error', err);
      form.setError('password', {
        message: err?.message || t('page.unlock.password.error'),
      });
    },
  });

  const handleSubmit = async (values: UnlockForm) => {
    if (isUnlockingRef.current) return;
    isUnlockingRef.current = true;
    await run(values.password);
    isUnlockingRef.current = false;
  };

  useEffect(() => {
    wallet.savedUnencryptedKeyringData().then(setHasForgotPassword);
  }, []);

  useEffect(() => {
    if (UiType.isTab || UiType.isDesktop) {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <UiProvider>
      <Container>
        <Content>
          <img src={BackgroundSVG} className="mt-[-19px] w-[500px] h-[255px]" />
          <div className="flex flex-col items-center gap-2 mb-10">
            <div className="text-2xl font-medium text-primary-foreground text-center">
              Welcome Back!
            </div>
            <div className="max-w-[320px] text-sm font-normal text-[#71717A] text-center">
              Enter your password to unlock
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full">
              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
                        autoFocus
                        spellCheck={false}
                        iconRight={
                          showPassword ? (
                            <EyeOff
                              className="w-5 h-5 text-r-neutral-body cursor-pointer"
                              onClick={() => setShowPassword(false)}
                            />
                          ) : (
                            <Eye
                              className="w-5 h-5 text-r-neutral-body cursor-pointer"
                              onClick={() => setShowPassword(true)}
                            />
                          )
                        }
                      />
                    </FormControl>
                    {fieldState.error && (
                      <FormMessage className="text-[13px] leading-4 mt-4 text-r-red-default font-medium">
                        <div>
                          <span>{fieldState.error.message}</span>
                          {hasForgotPassword && (
                            <button
                              type="button"
                              className="text-r-blue-default font-medium underline ml-2"
                              onClick={() => setOpen(true)}
                            >
                              {t('page.unlock.btnForgotPassword')}
                            </button>
                          )}
                        </div>
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </Content>

        <Action className="flex flex-col gap-3 items-center">
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            className="w-full text-[16px] font-medium"
            disabled={isUnlockingRef.current || !form.formState.isValid}
          >
            {t('page.unlock.btn.unlock')}
          </Button>

          {hasForgotPassword && (
            <button
              type="button"
              className="text-r-neutral-body text-[13px] leading-4 font-medium hover:underline"
              onClick={() => setOpen(true)}
            >
              {t('page.unlock.btnForgotPassword')}
            </button>
          )}
        </Action>
      </Container>
      <ResetWalletModal open={open} onOpenChange={setOpen} />
    </UiProvider>
  );
};

export default Unlock;
