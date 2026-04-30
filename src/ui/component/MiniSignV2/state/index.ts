import { typedDataSignatureManager } from './TypedDataSignatureManager';
import type { SignatureFlowState } from './types';
import { signatureManager } from './SignatureManager';
import { useSignatureStoreOf } from './useSignatureStore';
export { registry, useRegistryInstances } from '../registry';

export * from './types';
export { signatureManager } from './SignatureManager';
export { shallowEqual, useSignatureStoreOf } from './useSignatureStore';
export {
  SignatureInstanceProvider,
  useSignatureInstance,
} from './SignatureInstanceContext';
export {
  typedDataSignatureManager,
  useTypedDataSignatureStore,
  typedDataSignatureStore,
} from './TypedDataSignatureManager';

export const signatureStore = signatureManager;

export const useSignatureStore = <T = SignatureFlowState>(
  selector?: (state: SignatureFlowState) => T,
  isEqual?: (left: T, right: T) => boolean
) => useSignatureStoreOf(signatureManager, selector, isEqual);
