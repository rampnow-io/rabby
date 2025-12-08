"use client"

import {
  Button,
  ButtonSize,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Image,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@repo/ui/primitives"
import QRCodeUtil from "qrcode"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { type LoginRequest, type MfaData } from "./sign-in"

interface OtpFormProps {
  mfaData: MfaData | undefined
  loginRequest: LoginRequest
  onSubmit: (value: LoginRequest) => void
}

export function TotpForm({ mfaData, loginRequest, onSubmit }: OtpFormProps) {
  const form = useForm<{ totpCode: string }>()
  const [qrCodeImage, setQrCodeImage] = useState("")

  useEffect(() => {
    if (mfaData?.totpSetupUrl) {
      QRCodeUtil.toDataURL(mfaData.totpSetupUrl).then((data: string) => {
        setQrCodeImage(data)
      })
    }
  }, [mfaData])

  const onSubmitWithOtp = (data: { totpCode: string }) => {
    onSubmit({ ...loginRequest, totpCode: data.totpCode })
  }

  return (
    <>
      {qrCodeImage != "" && (
        <div className='flex flex-col items-center'>
          <label className='block text-sm font-medium text-gray-900'>
            Scan the QR Code using Authenticator App
          </label>
          <Image
            src={qrCodeImage}
            alt='TOTP QR Code'
            width={200}
            height={200}
          />
        </div>
      )}

      <div className='mt-5'>
        <label className='block text-sm font-medium text-gray-900'>
          Enter TOTP Code
        </label>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmitWithOtp)}
            className='flex flex-col'
          >
            <FormField
              control={form.control}
              name='totpCode'
              render={({ field }) => (
                <FormItem className='mt-2'>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        {Array.from({ length: 6 }, (_, index) => (
                          <InputOTPSlot
                            key={index}
                            index={index}
                            error={Boolean(form.formState.errors.totpCode)}
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type='submit'
              className='mt-5 w-full'
              buttonSize={ButtonSize.SM}
            >
              Verify TOTP
            </Button>
          </form>
        </Form>
      </div>
    </>
  )
}
