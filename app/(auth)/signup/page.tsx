"use client"

import * as React from "react"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Eye, EyeOff } from "lucide-react"
import { SignUpInput, signUpSchema } from "@/lib/auth/action/schema"
import { signUp } from "@/lib/auth/action/sign-up"

export default function Page() {
  const [showPassword, setShowPassword] = React.useState(true)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(true)
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<SignUpInput>({
    resolver: standardSchemaResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  async function onSubmit(data: SignUpInput) {
    startTransition(async () => {
      const result = await signUp(data)
      if (result?.error) {
        toast.error("ログインに失敗しました", {
          description: result.error,
        })
      }
    })
  }

  return (
    <Card className="w-full md:max-w-lg">
      <CardHeader>
        <CardTitle>アカウント作成</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="signup-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">
                    名前
                  </FieldLabel>
                  <Input
                    {...field}
                    id="name"
                    aria-required
                    aria-invalid={fieldState.invalid}
                    placeholder="山田 太郎"
                    autoComplete="name"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">
                    メールアドレス
                  </FieldLabel>
                  <Input
                    {...field}
                    id="email"
                    aria-required
                    aria-invalid={fieldState.invalid}
                    placeholder="test@gmail.com"
                    autoComplete="email"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password">
                    パスワード
                  </FieldLabel>
                  <FieldDescription>
                    8文字以上で入力してください
                  </FieldDescription>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="password"
                      type={showPassword ? "password" : "text"}
                      aria-required
                      aria-invalid={fieldState.invalid}
                      aria-describedby="password-error"
                      autoComplete="new-password"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        aria-label={showPassword ? "パスワードを表示する" : "パスワードを隠す"}
                        onClick={() => setShowPassword((p) => !p)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && (
                    <FieldError id="password-error" errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="confirm-password">
                    パスワード（確認）
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="confirm-password"
                      type={showConfirmPassword ? "password" : "text"}
                      aria-required
                      aria-invalid={fieldState.invalid}
                      aria-describedby="confirm-password-error"
                      autoComplete="new-password"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        aria-label={showConfirmPassword ? "パスワードを表示する" : "パスワードを隠す"}
                        onClick={() => setShowConfirmPassword((p) => !p)}
                      >
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && (
                    <FieldError id="confirm-password-error" errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal" className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            入力をリセット
          </Button>
          <Button type="submit" form="signup-form">
            アカウントを作成する
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
