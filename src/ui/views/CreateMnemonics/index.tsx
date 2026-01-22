import React, { useEffect } from 'react';
import { connectStore, useRabbyDispatch, useRabbySelector } from 'ui/store';
import DisplayMnemonic from './DisplayMnemonic';
import { useTranslation } from 'react-i18next';

const CreateMnemonic = () => {
  const step = useRabbySelector((s) => s.createMnemonics.step);
  const loading = step == 'risk-check';
  const dispatch = useRabbyDispatch();
  const { t } = useTranslation();

  useEffect(() => {
    dispatch.createMnemonics.getAllHDKeyrings();
  }, []);

  useEffect(() => {
    if (step !== 'display') {
      dispatch.createMnemonics.stepTo('display');
    }
  }, [loading, step]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-gray-300 border-t-blue-600" />
          <span className="text-sm text-gray-500">
            {t('Loading wallet recovery phrase…')}
          </span>
        </div>
      </div>
    );
  }

  return <DisplayMnemonic />;
};

export default connectStore()(CreateMnemonic);
