"use client"

import { parseError } from "@repo/utils"
import { signIn } from "next-auth/react"
import { useState } from "react"
import {
  Button,
  ButtonSize,
  ButtonType,
  Image,
  useToast,
} from "../../primitives"
import { type AuthMessage } from "./constants"
import { PasswordForm } from "./form-password"
import { TotpForm } from "./form-totp"

export interface LoginRequest {
  username: string
  password: string
  totpCode?: string
}

export interface MfaData {
  message: AuthMessage
  totpSetupUrl?: string
}

export function SignInForm({ enableOauth = false }: { enableOauth?: boolean }) {
  const { toast } = useToast()

  const [mfaData, setMfaData] = useState<MfaData | null>(null)
  const [loginRequest, setLoginRequest] = useState<LoginRequest>({
    username: "",
    password: "",
  })

  const onSubmit = async (data: LoginRequest) => {
    setLoginRequest(data)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        ...data,
      })

      if (!result) {
        throw "Invalid result"
      }

      if (result.status === 200) {
        window.location.href = result?.url ?? "/"
        return
      }

      if (result.error === "CredentialsSignin") {
        toast({
          title: "Failed to Sign In",
          description: "Invalid credentials",
        })
      } else {
        const parsedData: MfaData = JSON.parse(result.error ?? "")
        if (parsedData.message) {
          setMfaData(parsedData)
          return
        }
      }

      throw "Invalid error"
    } catch (error) {
      toast({
        title: "Login Error",
        description: parseError(error),
      })
    }
  }

  const handleZohoLogin = async () => {
    try {
      await signIn("zoho", { callbackUrl: "/" })
    } catch (error) {
      toast({
        title: "Zoho Login Error",
        description: parseError(error),
      })
    }
  }

  return (
    <div className='mt-5'>
      {!mfaData ? (
        <>
          <PasswordForm onSubmit={onSubmit} />
          {enableOauth && (
            <>
              <div className='relative my-6'>
                <div className='absolute inset-0 flex items-center'>
                  <span className='w-full border-t' />
                </div>
                <div className='relative flex justify-center text-xs uppercase'>
                  <span className='bg-white px-2 text-gray-500'>
                    Or Continue With
                  </span>
                </div>
              </div>
              <Button
                type='button'
                buttonType={ButtonType.SECONDARY}
                buttonSize={ButtonSize.SM}
                className='w-full gap-2'
                onClick={handleZohoLogin}
              >
                <Image
                  src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT24Xhm5FGsaeaT7D0dJ8QvahdBc29SxRrukzGTdl2dFheZPw3oooTC1k5FgqITx9Ktzs0&usqp=CAU'
                  alt='Zoho One'
                  height={20}
                  width={20}
                />
                Sign in with Zoho One
              </Button>
            </>
          )}
        </>
      ) : (
        <TotpForm
          mfaData={mfaData}
          loginRequest={loginRequest}
          onSubmit={onSubmit}
        />
      )}
    </div>
  )
}
