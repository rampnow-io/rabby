import React, { useRef } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { getUiType } from 'ui/utils';
import { KEYRING_CLASS } from 'consts';
import { HDManager } from '../HDManager/HDManager';
import { useRabbyDispatch } from '@/ui/store';

type State = {
  keyring: string;
  isMnemonics?: boolean;
  isWebHID?: boolean;
  path?: string;
  keyringId?: number | null;
  ledgerLive?: boolean;
  brand?: string;
};

const SelectAddress = () => {
  const history = useHistory();
  const { state = {} as State, search } = useLocation<State>();
  const query = new URLSearchParams(search);

  state.keyring = state.keyring || (query.get('hd') as string);
  state.brand = state.brand || (query.get('brand') as string);

  if (query.get('keyringId') && !state.keyringId) {
    state.keyringId = Number(query.get('keyringId'));
  }

  if (!state) {
    if (getUiType().isTab) {
      history.length ? history.goBack() : window.close();
    } else {
      history.replace('/dashboard');
    }
    return null;
  }

  const [isMounted, setIsMounted] = React.useState(false);
  const dispatch = useRabbyDispatch();
  const keyringId = useRef<number | null | undefined>(state.keyringId);

  const isMnemonic = state.keyring === KEYRING_CLASS.MNEMONIC;

  const initMnemonics = async () => {
    if (isMnemonic) {
      dispatch.importMnemonics.switchKeyring({
        stashKeyringId: keyringId.current as number,
      });
    }
    setIsMounted(true);
  };

  React.useEffect(() => {
    initMnemonics();
  }, [query]);

  if (isMnemonic && !isMounted) return null;

  return (
    <div className="w-full overflow-hidden">
      <HDManager
        keyringId={keyringId.current ?? null}
        keyring={state.keyring}
        brand={state.brand}
      />
    </div>
  );
};

export default SelectAddress;
