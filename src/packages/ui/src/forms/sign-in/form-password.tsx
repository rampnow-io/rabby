"use client"

import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import {
  Button,
  ButtonSize,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  InputSize,
} from "../../primitives"
import { type LoginRequest } from "./sign-in"

interface PasswordToggeleProps {
  isVisible: boolean
  onChange: () => void
}

export function PasswordEyeButton({
  isVisible,
  onChange,
}: PasswordToggeleProps) {
  return (
    <button type='button' onClick={onChange}>
      {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
    </button>
  )
}

export function PasswordForm({
  onSubmit,
}: {
  onSubmit: (data: LoginRequest) => void
}) {
  const form = useForm<LoginRequest>()
  const [isPasswordVisible, setPasswordVisibility] = useState<boolean>(false)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className='flex flex-col gap-4'>
          <FormField
            control={form.control}
            name='username'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    sizeVariant={InputSize.SM}
                    className=' w-full'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    className=' w-full'
                    sizeVariant={InputSize.SM}
                    type={isPasswordVisible ? "Text" : "Password"}
                    {...field}
                    iconRight={
                      <PasswordEyeButton
                        isVisible={isPasswordVisible}
                        onChange={() => {
                          setPasswordVisibility(!isPasswordVisible)
                        }}
                      />
                    }
                  />
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
            Sign In
          </Button>
        </div>
      </form>
    </Form>
  )
}
