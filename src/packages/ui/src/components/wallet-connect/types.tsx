export type TxnType = "transfer" | "approve" | "raw"

export interface TxnData {
  txnType: TxnType
  receiverAddress: string
  amount: string
  currency: string
  message?: string
}

export enum ConnectButtonType {
  LABEL = "label",
  ICON = "icon",
}
