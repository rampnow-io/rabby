/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import BigNumber from 'bignumber.js';
import { useRequest } from 'ahooks';
import { useWallet } from '@/ui/utils';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';
import { useAddressInfo } from '@/ui/hooks/useAddressInfo';
import { useAddressRisks } from '@/ui/hooks/useAddressRisk';
import { findChain } from '@/utils/chain';

// Types
export type TokenItem = {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  logo_url?: string;
  chain: string;
  display_symbol?: string | null;
  optimized_symbol?: string;
  price?: number;
  is_verified?: boolean;
  is_core?: boolean;
  is_wallet?: boolean;
  time_at?: number;
  amount?: number;
  raw_amount_hex_str?: string;
  cex_ids?: string[];
};

export type GasLevel = {
  level: 'slow' | 'normal' | 'fast' | 'custom';
  price: number;
  estimated_seconds: number;
};

export type SendFormData = {
  token: TokenItem | null;
  recipient: string;
  amount: string;
  gasLevel?: GasLevel | null;
};

export type RiskItem = {
  value: string;
  type: string;
};

export type SendTokenContextType = {
  // Form State
  formData: SendFormData;
  step: 'recipient' | 'token' | 'amount' | 'review' | 'confirm';

  // Form Handlers
  handleRecipientChange: (address: string) => void;
  handleTokenSelect: (token: TokenItem) => void;
  handleAmountChange: (amount: string) => void;
  handleGasLevelChange: (gasLevel: GasLevel) => void;
  handleBack: () => void;
  handleSubmit: () => Promise<void>;
  setStep: (
    step: 'recipient' | 'token' | 'amount' | 'review' | 'confirm'
  ) => void;

  // Token Management
  tokenList: TokenItem[];
  tokensLoading: boolean;
  currentToken: TokenItem | null;
  loadCurrentToken: (
    id: string,
    chainId: string,
    address: string
  ) => Promise<TokenItem | null>;

  // Address Validation
  addressDesc: any;
  loadingToAddressDesc: boolean;
  isAddressValid: boolean;
  isBlockedAddress: boolean;
  targetAccount: any;
  isMyImported: boolean;

  // Risk Management
  risks: RiskItem[];
  loadingRisks: boolean;
  mostImportantRisks: RiskItem[];
  hasRiskForToAddress: boolean;
  hasRiskForToken: boolean;
  agreeRequiredChecks: {
    forToAddress: boolean;
    forToken: boolean;
  };
  setAgreeRequiredChecks: (checks: any) => void;

  // Gas Management
  gasList: GasLevel[] | undefined;
  loadingGasList: boolean;
  gasFee: string;
  gasLoading: boolean;
  estimatedGas: number;
  chainTokenGasFees: {
    gasLimit: number;
    maybeL1Fee: BigNumber | null;
  };
  canUseDirectSubmit: boolean;

  // Balance
  balance: BigNumber;
  balanceError: string | null;
  canSubmitBasic: boolean;
  canSubmit: boolean;

  // Loading States
  isLoading: boolean;
  isSubmitLoading: boolean;
  miniSignLoading: boolean;

  // Account
  currentAccount: any;
  chainItem: any;
};

const SendTokenContext = createContext<SendTokenContextType | undefined>(
  undefined
);

export const useSendTokenContext = () => {
  const context = useContext(SendTokenContext);
  if (!context) {
    throw new Error(
      'useSendTokenContext must be used within SendTokenProvider'
    );
  }
  return context;
};

interface SendTokenProviderProps {
  children: ReactNode;
  initialRecipient?: string;
  initialToken?: TokenItem;
  initialAmount?: string;
}

export const SendTokenProvider: React.FC<SendTokenProviderProps> = ({
  children,
  initialRecipient = '',
  initialToken = null,
  initialAmount = '',
}) => {
  const wallet = useWallet();
  const currentAccount = useCurrentAccount();

  // Form State
  const [formData, setFormData] = useState<SendFormData>({
    token: initialToken,
    recipient: initialRecipient,
    amount: initialAmount,
    gasLevel: null,
  });

  const [step, setStep] = useState<
    'recipient' | 'token' | 'amount' | 'review' | 'confirm'
  >('recipient');

  // Token State
  const [tokenList, setTokenList] = useState<TokenItem[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);

  // Address Validation
  const {
    addressDesc,
    targetAccount,
    isMyImported = false,
    loading: loadingToAddressDesc,
  } = useAddressInfo(formData.recipient);
  const [isBlockedAddress, setIsBlockedAddress] = useState(false);

  // Risk Management
  const [agreeRequiredChecks, setAgreeRequiredChecks] = useState({
    forToAddress: false,
    forToken: false,
  });
  const { loading: loadingRisks, risks } = useAddressRisks(
    formData.recipient || '',
    {
      scene: 'send-token',
    }
  );

  // Gas Management
  const [gasList, setGasList] = useState<GasLevel[] | undefined>();
  const [loadingGasList, setLoadingGasList] = useState(false);
  const [gasFee, setGasFee] = useState<string>('0');
  const [gasLoading, setGasLoading] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState(0);
  const [chainTokenGasFees, setChainTokenGasFees] = useState<{
    gasLimit: number;
    maybeL1Fee: BigNumber | null;
  }>({
    gasLimit: 21000,
    maybeL1Fee: null,
  });

  // Balance & Validation
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [miniSignLoading, setMiniSignLoading] = useState(false);

  // Chain
  const chainItem = useMemo(() => findChain({ enum: 'eth' }), []);

  // ============ TOKEN MANAGEMENT ============

  // Fetch tokens on account change
  useEffect(() => {
    if (!currentAccount) return;

    const fetchTokens = async () => {
      try {
        setTokensLoading(true);
        const chainItem = findChain({ enum: 'eth' });
        if (!chainItem?.serverId) return;

        const tokens = await wallet.openapi.listToken(
          currentAccount.address,
          chainItem.serverId
        );
        setTokenList(tokens || []);
      } catch (e) {
        console.error('Failed to fetch tokens:', e);
        setTokenList([]);
      } finally {
        setTokensLoading(false);
      }
    };

    fetchTokens();
  }, [currentAccount, wallet]);

  const loadCurrentToken = useCallback(
    async (id: string, chainId: string, address: string) => {
      try {
        setIsLoading(true);
        const token = await wallet.openapi.getToken(address, chainId, id);
        if (token) {
          setFormData((prev) => ({ ...prev, token }));
          return token;
        }
      } catch (e) {
        console.error('Failed to load token:', e);
      } finally {
        setIsLoading(false);
      }
      return null;
    },
    [wallet]
  );

  // ============ ADDRESS VALIDATION ============

  const isAddressValid = useMemo(() => {
    return /^0x[a-fA-F0-9]{40}$/.test(formData.recipient);
  }, [formData.recipient]);

  // Check blocked address
  useEffect(() => {
    if (!isAddressValid) return;

    const checkBlocked = async () => {
      try {
        const { is_blocked } = await wallet.openapi.isBlockedAddress(
          formData.recipient
        );
        setIsBlockedAddress(is_blocked);
      } catch (e) {
        console.error('Failed to check blocked address:', e);
      }
    };

    checkBlocked();
  }, [formData.recipient, isAddressValid, wallet]);

  // ============ GAS ESTIMATION ============

  // Fetch gas list
  const fetchGasList = useCallback(async () => {
    if (!formData.token || !chainItem || !currentAccount?.address) return [];

    try {
      setLoadingGasList(true);
      const gasList = await wallet.gasMarketV2({
        chain: chainItem,
        tx: {
          from: currentAccount.address,
          to: formData.recipient,
          value: '0x0',
          data: '0x',
          chainId: chainItem.id || 1,
        } as any,
      });
      setGasList(gasList as any);
      return gasList as any;
    } catch (e) {
      console.error('Failed to fetch gas list:', e);
      return [];
    } finally {
      setLoadingGasList(false);
    }
  }, [formData.token, formData.recipient, chainItem, currentAccount, wallet]);

  // Estimate gas when form changes
  useEffect(() => {
    if (!formData.token || !formData.recipient || !formData.amount) {
      return;
    }

    const timer = setTimeout(() => {
      fetchGasList();
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.token, formData.recipient, formData.amount, fetchGasList]);

  // ============ BALANCE VALIDATION ============

  const balance = useMemo(() => {
    if (!formData.token?.raw_amount_hex_str) {
      return new BigNumber(0);
    }
    return new BigNumber(formData.token.raw_amount_hex_str).div(
      10 ** (formData.token.decimals || 18)
    );
  }, [formData.token]);

  // Validate balance
  useEffect(() => {
    if (!formData.token || !formData.amount) {
      setBalanceError(null);
      return;
    }

    const amount = new BigNumber(formData.amount || 0);
    if (amount.isGreaterThan(balance)) {
      setBalanceError('Insufficient balance');
    } else {
      setBalanceError(null);
    }
  }, [formData.token, formData.amount, balance]);

  // ============ RISK MANAGEMENT ============

  const mostImportantRisks = useMemo(() => {
    if (!risks || risks.length === 0) return [];
    return risks.slice(0, 1).map((risk: any) => ({
      value: risk.value || risk.toString(),
      type: risk.type || 'warning',
    }));
  }, [risks]);

  const hasRiskForToAddress = useMemo(() => {
    return risks && risks.length > 0;
  }, [risks]);

  const hasRiskForToken = useMemo(() => {
    return false; // Implement token risk check
  }, []);

  // ============ SUBMISSION CHECKS ============

  const canSubmitBasic = useMemo(() => {
    return (
      isAddressValid &&
      !!formData.token &&
      !balanceError &&
      new BigNumber(formData.amount || 0).gte(0) &&
      !isLoading
    );
  }, [
    isAddressValid,
    formData.token,
    balanceError,
    formData.amount,
    isLoading,
  ]);

  const canSubmit = useMemo(() => {
    return (
      canSubmitBasic &&
      !loadingRisks &&
      (!hasRiskForToAddress || agreeRequiredChecks.forToAddress) &&
      (!hasRiskForToken || agreeRequiredChecks.forToken)
    );
  }, [
    canSubmitBasic,
    loadingRisks,
    hasRiskForToAddress,
    hasRiskForToken,
    agreeRequiredChecks,
  ]);

  const canUseDirectSubmit = useMemo(() => {
    return canSubmitBasic && !isBlockedAddress;
  }, [canSubmitBasic, isBlockedAddress]);

  // ============ HANDLERS ============

  const handleRecipientChange = useCallback((address: string) => {
    setFormData((prev) => ({ ...prev, recipient: address }));
  }, []);

  const handleTokenSelect = useCallback((token: TokenItem) => {
    setFormData((prev) => ({ ...prev, token }));
    setStep('amount');
  }, []);

  const handleAmountChange = useCallback((amount: string) => {
    setFormData((prev) => ({ ...prev, amount }));
  }, []);

  const handleGasLevelChange = useCallback((gasLevel: GasLevel) => {
    setFormData((prev) => ({ ...prev, gasLevel }));
    setGasFee((gasLevel.price || 0).toString());
  }, []);

  const handleBack = useCallback(() => {
    if (step === 'recipient') {
      window.history.back();
    } else if (step === 'token') {
      setStep('recipient');
    } else if (step === 'amount') {
      setStep('token');
    } else if (step === 'review') {
      setStep('amount');
    } else if (step === 'confirm') {
      setStep('review');
    }
  }, [step]);

  const handleSubmit = useCallback(async () => {
    if (!formData.token || !formData.recipient || !formData.amount) {
      return;
    }

    try {
      setIsSubmitLoading(true);

      // TODO: Implement actual transaction submission
      // const tx = await wallet.sendTransaction({
      //   to: formData.recipient,
      //   token: formData.token,
      //   amount: formData.amount,
      //   gasLevel: formData.gasLevel,
      // });

      console.log('Submitting transaction:', formData);

      // Reset form after success
      setFormData({
        token: null,
        recipient: '',
        amount: '',
        gasLevel: null,
      });
      setStep('recipient');
    } catch (e) {
      console.error('Failed to submit transaction:', e);
    } finally {
      setIsSubmitLoading(false);
    }
  }, [formData, wallet]);

  const value: SendTokenContextType = {
    // Form State
    formData,
    step,
    setStep: (step: any) => setStep(step),

    // Form Handlers
    handleRecipientChange,
    handleTokenSelect,
    handleAmountChange,
    handleGasLevelChange,
    handleBack,
    handleSubmit,

    // Token Management
    tokenList,
    tokensLoading,
    currentToken: formData.token,
    loadCurrentToken,

    // Address Validation
    addressDesc,
    loadingToAddressDesc,
    isAddressValid,
    isBlockedAddress,
    targetAccount,
    isMyImported,

    // Risk Management
    risks: (risks || []).map((r: any) => ({
      value: r.value || r.toString(),
      type: r.type || 'warning',
    })),
    loadingRisks,
    mostImportantRisks,
    hasRiskForToAddress,
    hasRiskForToken,
    agreeRequiredChecks,
    setAgreeRequiredChecks,

    // Gas Management
    gasList,
    loadingGasList,
    gasFee,
    gasLoading,
    estimatedGas,
    chainTokenGasFees,
    canUseDirectSubmit,

    // Balance
    balance,
    balanceError,
    canSubmitBasic,
    canSubmit,

    // Loading States
    isLoading,
    isSubmitLoading,
    miniSignLoading,

    // Account
    currentAccount,
    chainItem,
  };

  return (
    <SendTokenContext.Provider value={value}>
      {children}
    </SendTokenContext.Provider>
  );
};

export default SendTokenContext;
