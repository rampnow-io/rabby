import { PillStatus } from "../../primitives"

export function getPaymentStatusState(status?: string): PillStatus {
  switch (status?.toLowerCase()) {
    case "created":
      return PillStatus.WARNING
    case "pending":
      return PillStatus.WARNING
    case "accepted":
      return PillStatus.SUCCESS
    case "completed":
      return PillStatus.SUCCESS
    case "rejected":
      return PillStatus.ERROR
    case "expired":
      return PillStatus.ERROR
    case "canceled":
      return PillStatus.ERROR
    case "refunded":
      return PillStatus.ERROR
    case "authorized":
      return PillStatus.WARNING
    case "failed":
      return PillStatus.ERROR
  }
  return PillStatus.NORMAL
}

export function getOrderStatusState(status?: string): PillStatus {
  switch (status?.toLowerCase()) {
    case "created":
    case "pending":
    case "authorized":
      return PillStatus.WARNING

    case "accepted":
    case "completed":
      return PillStatus.SUCCESS

    case "rejected":
    case "expired":
    case "canceled":
    case "refunded":
    case "failed":
    case "payment_failed":
      return PillStatus.ERROR

    default:
      return PillStatus.NORMAL
  }
}

export function getPayoutStatusState(status?: string): PillStatus {
  switch (status?.toLowerCase()) {
    case "pending":
      return PillStatus.WARNING
    case "paid":
      return PillStatus.SUCCESS
    case "rejected":
      return PillStatus.ERROR
    case "canceled":
      return PillStatus.ERROR
  }

  return PillStatus.NORMAL
}

export function getChargebackStatusState(status?: string): PillStatus {
  switch (status?.toLowerCase()) {
    case "created":
      return PillStatus.SUCCESS
    case "accepted":
      return PillStatus.SUCCESS
  }

  return PillStatus.NORMAL
}

export function getRefundStatusState(status?: string): PillStatus {
  switch (status?.toLowerCase()) {
    case "created":
      return PillStatus.WARNING
    case "accepted":
      return PillStatus.SUCCESS
    case "rejected":
      return PillStatus.ERROR
    case "canceled":
      return PillStatus.WARNING
  }
  return PillStatus.NORMAL
}

export function getUserStatusState(status?: string): PillStatus {
  switch (status?.toLowerCase()) {
    case "active":
      return PillStatus.SUCCESS
    case "inactive":
      return PillStatus.WARNING
    case "blocked":
      return PillStatus.ERROR
  }
  return PillStatus.NORMAL
}

export function getRoutesStatusState(status?: string): PillStatus {
  switch (status?.toLowerCase()) {
    case "active":
      return PillStatus.SUCCESS
    case "inactive":
      return PillStatus.WARNING
    case "deprecated":
      return PillStatus.ERROR
  }

  return PillStatus.NORMAL
}

export function getRiskStatusState(status?: string): PillStatus {
  switch (status?.toLowerCase()) {
    case "initiated":
      return PillStatus.WARNING
    case "low":
      return PillStatus.SUCCESS
    case "moderate":
      return PillStatus.WARNING
    case "no_support":
      return PillStatus.WARNING
    case "high":
      return PillStatus.ERROR
  }
  return PillStatus.NORMAL
}

export function getWalletStatusState(status?: string): PillStatus {
  switch (status?.toLowerCase()) {
    case "active":
      return PillStatus.SUCCESS
    case "inactive":
      return PillStatus.WARNING
    case "blocked":
      return PillStatus.ERROR
  }

  return PillStatus.NORMAL
}
