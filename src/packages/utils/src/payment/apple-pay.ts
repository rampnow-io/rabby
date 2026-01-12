// Minimal ApplePayJS type definitions
declare class ApplePaySession {
  constructor(version: number, data: any);
  static STATUS_SUCCESS?: number;
  static STATUS_FAILURE?: number;
  static canMakePayments?: () => boolean;
  static canMakePaymentsWithActiveCard?: (merchantIdentifier: string) => Promise<boolean>;
}

declare global {
  interface Window {
    ApplePaySession?: typeof ApplePaySession;
  }
}

interface ApplePayValidateMerchantEvent {
  validationURL: string;
}

interface ApplePayPaymentToken {
  paymentData: object;
  paymentMethod: object;
  transactionIdentifier: string;
}

interface ApplePayPayment {
  token: ApplePayPaymentToken;
  billingContact?: object;
  shippingContact?: object;
}

interface ApplePayPaymentAuthorizedEvent {
  payment: ApplePayPayment;
}

interface ApplePaySessionInterface {
  onvalidatemerchant: ((event: ApplePayValidateMerchantEvent) => void) | null;
  onpaymentauthorized: ((event: ApplePayPaymentAuthorizedEvent) => void) | null;
  oncancel: (() => void) | null;
  completeMerchantValidation(sessionData: any): void;
  completePayment(result: { status: number }): void;
  begin(): void;
}

interface ApplePayProps {
  amount: string;
  country: string;
  currency: string;
  allowedCardSchemes: string[];
  getApplePaySessionData: (
    validationUrl: string
  ) => Promise<Record<string, unknown>>;
  processPayment: (
    paymentData: { token: string },
    onComplete: (result: boolean) => void
  ) => void;
}

const forceError = (error: unknown): Error => {
  return new Error(error instanceof Error ? error.message : String(error));
};

const processApplePaySdk = (props: ApplePayProps): Promise<number> => {
  return new Promise((resolve, reject) => {
    const version = 3;
    const data = {
      countryCode: props.country,
      currencyCode: props.currency,
      supportedNetworks: props.allowedCardSchemes,
      merchantCapabilities: ['supports3DS'],
      total: {
        label: 'Rampnow Pay',
        type: 'final',
        amount: props.amount,
      },
    };

    const session = new (window.ApplePaySession as any)(
      version,
      data
    ) as ApplePaySessionInterface;

    session.onvalidatemerchant = (event: ApplePayValidateMerchantEvent) => {
      props
        .getApplePaySessionData(event.validationURL)
        .then((sessionData) => {
          session.completeMerchantValidation(sessionData);
        })
        .catch((error: unknown) => {
          reject(forceError(error));
        });
    };

    session.onpaymentauthorized = (event: ApplePayPaymentAuthorizedEvent) => {
      const STATUS_SUCCESS =
        (window.ApplePaySession as any)?.STATUS_SUCCESS ?? 0;
      const STATUS_FAILURE =
        (window.ApplePaySession as any)?.STATUS_FAILURE ?? 1;

      const onPaymentProcessed = (result: boolean): void => {
        const status = result ? STATUS_SUCCESS : STATUS_FAILURE;
        session.completePayment({ status });
        resolve(status);
      };

      try {
        props.processPayment(
          { token: JSON.stringify(event.payment.token) },
          onPaymentProcessed
        );
      } catch (error) {
        session.completePayment({ status: STATUS_FAILURE });
        reject(forceError(error));
      }
    };

    session.oncancel = (): void => {
      const STATUS_FAILURE =
        (window.ApplePaySession as any)?.STATUS_FAILURE ?? 1;
      resolve(STATUS_FAILURE);
    };

    session.begin();
  });
};

const processApplePayW3c = (props: ApplePayProps): Promise<number> => {
  return new Promise((resolve, reject) => {
    try {
      const paymentMethodData = [
        {
          supportedMethods: 'https://apple.com/apple-pay',
          data: {
            merchantCapabilities: ['supports3DS'],
            supportedNetworks: props.allowedCardSchemes,
            countryCode: props.country,
          },
        },
      ];

      const paymentDetails = {
        total: {
          label: 'Rampnow Pay',
          amount: {
            value: props.amount,
            currency: props.currency,
          },
        },
      };

      const request = new PaymentRequest(paymentMethodData, paymentDetails);

      // @ts-expect-error - onmerchantvalidation is not recognized by TypeScript
      request.onmerchantvalidation = (event: {
        validationUrl: string;
        complete: (data: unknown) => void;
      }) => {
        void props
          .getApplePaySessionData(event.validationUrl)
          .then((sessionData) => {
            event.complete(sessionData);
          });
      };

      void request
        .show()
        .then((response: PaymentResponse) => {
          const token = JSON.stringify(response.details);

          props.processPayment({ token }, (result) => {
            const status: PaymentComplete = result ? 'success' : 'fail';
            void response.complete(status);

            if (result) {
              const STATUS_SUCCESS =
                (window.ApplePaySession as any)?.STATUS_SUCCESS ?? 0;
              resolve(STATUS_SUCCESS);
            } else {
              reject(new Error('Payment failed'));
            }
          });
        })
        .catch((error: unknown) => {
          reject(forceError(error));
        });
    } catch (error) {
      reject(forceError(error));
    }
  });
};

export const processApplePay = (props: ApplePayProps): Promise<number> => {
  return typeof window.ApplePaySession !== 'undefined'
    ? processApplePaySdk(props)
    : processApplePayW3c(props);
};
