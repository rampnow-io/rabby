export {
  createThirdwebClient,
  prepareTransaction,
  sendBatchTransaction,
  type PreparedTransaction,
} from "thirdweb"
export {
  ThirdwebProvider,
  useActiveAccount,
  useActiveWallet,
  useConnect,
  useConnectModal,
  useSendBatchTransaction,
  useSetActiveWallet,
  useSwitchActiveWalletChain,
  useDisconnect as useThirdwebDisconnect,
} from "thirdweb/react"
export { inAppWallet, smartWallet, type Account } from "thirdweb/wallets"

export * from "./config"
export * from "./connect-button"
export * from "./hooks"
