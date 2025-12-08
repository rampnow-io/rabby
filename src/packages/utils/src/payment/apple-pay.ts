interface ApplePayProps {
  amount: string
  country: string
  currency: string
  allowedCardSchemes: string[]
  getApplePaySessionData: (
    validationUrl: string,
  ) => Promise<Record<string, unknown>>
  processPayment: (
    paymentData: { token: string },
    onComplete: (result: boolean) => void,
  ) => void
}

const forceError = (error: unknown): Error => {
  return new Error(error instanceof Error ? error.message : String(error))
}

const processApplePaySdk = (props: ApplePayProps): Promise<number> => {
  return new Promise((resolve, reject) => {
    const version = 3
    const data = {
      countryCode: props.country,
      currencyCode: props.currency,
      supportedNetworks: props.allowedCardSchemes,
      merchantCapabilities: ["supports3DS"],
      total: {
        label: "Rampnow Pay",
        type: "final",
        amount: props.amount,
      },
    }

    // @ts-expect-error - ApplePaySession constructor is not fully typed
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Apple Pay constructor requires unsafe call
    const session = new window.ApplePaySession(version, data) as ApplePaySession

    session.onvalidatemerchant = (
      event: ApplePayJS.ApplePayValidateMerchantEvent,
    ) => {
      props
        .getApplePaySessionData(event.validationURL)
        .then((sessionData) => {
          session.completeMerchantValidation(sessionData)
        })
        .catch((error: unknown) => {
          reject(forceError(error))
        })
    }

    session.onpaymentauthorized = (
      event: ApplePayJS.ApplePayPaymentAuthorizedEvent,
    ) => {
      const onPaymentProcessed = (result: boolean): void => {
        const status = result
          ? ApplePaySession.STATUS_SUCCESS
          : ApplePaySession.STATUS_FAILURE
        session.completePayment({ status })
        resolve(status)
      }

      try {
        props.processPayment(
          { token: JSON.stringify(event.payment.token) },
          onPaymentProcessed,
        )
      } catch (error) {
        session.completePayment({ status: ApplePaySession.STATUS_FAILURE })
        reject(forceError(error))
      }
    }

    session.oncancel = (): void => {
      resolve(ApplePaySession.STATUS_FAILURE)
    }

    session.begin()
  })
}

const processApplePayW3c = (props: ApplePayProps): Promise<number> => {
  return new Promise((resolve, reject) => {
    try {
      const paymentMethodData = [
        {
          supportedMethods: "https://apple.com/apple-pay",
          data: {
            merchantCapabilities: ["supports3DS"],
            supportedNetworks: props.allowedCardSchemes,
            countryCode: props.country,
          },
        },
      ]

      const paymentDetails = {
        total: {
          label: "Rampnow Pay",
          amount: {
            value: props.amount,
            currency: props.currency,
          },
        },
      }

      const request = new PaymentRequest(paymentMethodData, paymentDetails)

      // @ts-expect-error - onmerchantvalidation is not recognized by TypeScript
      request.onmerchantvalidation = (event: {
        validationUrl: string
        complete: (data: unknown) => void
      }) => {
        void props
          .getApplePaySessionData(event.validationUrl)
          .then((sessionData) => {
            event.complete(sessionData)
          })
      }

      void request
        .show()
        .then((response: PaymentResponse) => {
          const token = JSON.stringify(response.details)

          props.processPayment({ token }, (result) => {
            const status: PaymentComplete = result ? "success" : "fail"
            void response.complete(status)

            if (result) {
              resolve(ApplePaySession.STATUS_SUCCESS)
            } else {
              reject(new Error("Payment failed"))
            }
          })
        })
        .catch((error: unknown) => {
          reject(forceError(error))
        })
    } catch (error) {
      reject(forceError(error))
    }
  })
}

export const processApplePay = (props: ApplePayProps): Promise<number> => {
  // @ts-expect-error - ApplePaySession is not recognized by TypeScript
  return typeof window.ApplePaySession !== "undefined"
    ? processApplePaySdk(props)
    : processApplePayW3c(props)
}
