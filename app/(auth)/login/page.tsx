"use client"

import * as React from "react"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { LoginInput, loginSchema } from "@/lib/auth/action/schema"
import Link from "next/link"
import { login } from "@/lib/auth/action/login"

export default function Page() {
  const [showPassword, setShowPassword] = React.useState(true)
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<LoginInput>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  function onSubmit(data: LoginInput) {
    startTransition(async () => {
      const result = await login(data)
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
        <CardTitle>ログイン</CardTitle>
        <CardDescription>
          ここに何か説明を残せるがログインはログインというタイトルだけで明確なので記載不要としてOK
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="login-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="mail">
                    メールアドレス
                  </FieldLabel>
                  <Input
                    {...field}
                    id="mail"
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
                    8文字以上入力してください
                  </FieldDescription>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="password"
                      type={showPassword ? "password" : "text"}
                      aria-required
                      aria-invalid={fieldState.invalid}
                      aria-describedby="password-error"
                      autoComplete="current-password"
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
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal" className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            入力をリセット
          </Button>
          <Button type="submit" form="login-form" disabled={isPending}>
            ログインする{isPending && <Loader2 />}
          </Button>
        </Field>
        <Link href="/signup" className={buttonVariants({
          variant: "ghost",
          className: "text-blue-500 underline"
        })}>会員登録の方はこちら</Link>
      </CardFooter>
    </Card>
  )
}
