import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import clsx from 'clsx';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';

import { Checkbox, Field } from 'ui/component';
import { WrappedComponentProps, wrapModalPromise } from '../Modal/WrapPromise';
import { getUiType } from '@/ui/utils';
import BottomFloatingSheet from '../BottomFloatingPopup';
import {
  Button,
  ButtonType,
  Form,
  FormControl,
  FormField,
  FormItem,
  Input,
} from '@repo/ui/primitives';

const isTab = getUiType().isTab;

/* ---------------- styled blocks ---------------- */

const Description = styled.div`
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 16px;
  text-align: center;
  color: var(--r-neutral-body, #d3d8e0);
`;

const FieldList = styled.div`
  margin-bottom: 20px;

  .field {
    background: var(--r-neutral-card-2, rgba(255, 255, 255, 0.06));
    border-radius: 6px;
    padding: 16px 12px;
    font-size: 14px;
    line-height: 18px;
    color: var(--r-neutral-title-1, #f7fafc);
    border: 1px solid transparent;
    margin-bottom: 8px;

    &:hover {
      background-color: rgba(134, 151, 255, 0.2);
      border-color: var(--r-blue-default, #7084ff);
    }
  }
`;

/* ---------------- checklist hook ---------------- */

function useQuestionsCheck(checklist: string[]) {
  const QUESTIONS = useMemo(
    () =>
      checklist.map((item, index) => ({
        index,
        content: item,
        checked: false,
      })),
    [checklist]
  );

  const [questionChecks, setQuestionChecks] = useState(QUESTIONS);

  const toggleCheckedByIndex = useCallback((index: number) => {
    setQuestionChecks((prev) =>
      prev.map((q) => (q.index === index ? { ...q, checked: !q.checked } : q))
    );
  }, []);

  const reset = useCallback(() => {
    setQuestionChecks((prev) => prev.map((q) => ({ ...q, checked: false })));
  }, []);

  return {
    questionChecks,
    isAllChecked: questionChecks.every((q) => q.checked),
    toggleCheckedByIndex,
    reset,
  };
}

/* ---------------- props ---------------- */

interface AuthenticationModalProps extends WrappedComponentProps {
  validationHandler?(password: string): Promise<void>;
  confirmText?: string;
  cancelText?: string;
  confrimClassName?: string;
  title?: string;
  description?: string;
  checklist?: string[];
  placeholder?: string;
  btnClassName?: string;
  containerClassName?: string;
  forceRender?: boolean;
}

type FormValues = {
  password: string;
};

/* ---------------- component ---------------- */

const AuthenticationPopup = ({
  description,
  checklist = [],
  validationHandler,
  onFinished,
  onCancel,
  wallet,
  cancelText,
  confirmText = 'Confirm',
  title = 'Enter Password',
  placeholder,
  confrimClassName,
  btnClassName,
  containerClassName,
  forceRender,
}: AuthenticationModalProps) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const {
    questionChecks,
    isAllChecked,
    toggleCheckedByIndex,
    reset,
  } = useQuestionsCheck(checklist);

  const form = useForm<FormValues>({
    defaultValues: { password: '' },
  });

  const password = form.watch('password');

  useEffect(() => {
    setTimeout(() => {
      setVisible(true);
      inputRef.current?.focus();
    });
  }, []);

  const handleCancel = () => {
    reset();
    setVisible(false);
    onCancel();
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      if (validationHandler) {
        await validationHandler(values.password);
      } else {
        await wallet?.verifyPassword(values.password);
      }
      reset();
      setVisible(false);
      onFinished();
    } catch (e: any) {
      form.setError('password', {
        type: 'manual',
        message: e?.message || t('component.AuthenticationModal.passwordError'),
      });
    }
  };

  return (
    <BottomFloatingSheet
      open={visible}
      onClose={handleCancel}
      className={clsx('input-password-popup', containerClassName)}
      contentClassName={clsx({
        'pt-2': !!description || checklist.length > 0,
      })}
    >
      <div className="mb-2 mt-2 text-center text-[16px] font-medium text-r-neutral-title-1">
        {title}
      </div>

      {description && <Description>{description}</Description>}

      {checklist.length > 0 && (
        <FieldList>
          {questionChecks.map((q) => (
            <Field
              key={q.index}
              leftIcon={
                <Checkbox
                  checked={q.checked}
                  width="20px"
                  height="20px"
                  background="var(--r-green-default, #2ABB7F)"
                  unCheckBackground="var(--r-neutral-line, rgba(255,255,255,0.1))"
                  onChange={() => toggleCheckedByIndex(q.index)}
                />
              }
              rightIcon={null}
              onClick={() => toggleCheckedByIndex(q.index)}
            >
              {q.content}
            </Field>
          ))}
        </FieldList>
      )}

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
                    autoFocus={!isTab}
                    placeholder={
                      placeholder ??
                      t('component.AuthenticationModal.passwordPlaceholder')
                    }
                    className={clsx(
                      'h-[56px] rounded-[8px] bg-transparent',
                      fieldState.error && 'border border-r-red-default'
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

          <div
            className={clsx(
              'flex pt-6 px-5',
              btnClassName,
              cancelText ? 'justify-between' : 'justify-center'
            )}
          >
            {cancelText && (
              <Button
                buttonType={ButtonType.GHOST}
                className="w-[172px]"
                onClick={handleCancel}
              >
                {cancelText}
              </Button>
            )}

            <Button
              type="submit"
              className={
                confrimClassName ?? clsx(cancelText ? 'w-[172px]' : 'w-[200px]')
              }
              disabled={checklist.length > 0 ? !isAllChecked : false}
            >
              {confirmText}
            </Button>
          </div>
        </form>
      </Form>
    </BottomFloatingSheet>
  );
};

const AuthenticationPopupPromise = wrapModalPromise<AuthenticationModalProps>(
  AuthenticationPopup
);

export default AuthenticationPopupPromise;
