"use client"

import * as React from "react"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
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
import { Eye, EyeOff } from "lucide-react"
import { setCookieAction } from "./setCookie"
import { useRouter } from "next/navigation"

const formSchema = z.object({
  email: z.email("メールアドレスの形式で入力してください（例: name@example.com）"),
  password: z.string().min(4, "パスワードは4文字以上で入力してください"),

})

export default function Page() {
  const [showPassword, setShowPassword] = React.useState(true)
  const router = useRouter()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    },
    mode: 'onSubmit',        // RHF自体はsubmitのみ
    reValidateMode: 'onChange', // 一度エラーが出たら即時再検証
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    toast("ログインに成功しました。以下が送信された値です。", {
      description: (
        <pre className="mt-2 w-[320px] overflow-x-auto rounded-md bg-code p-4 text-code-foreground">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
      position: "bottom-right",
      classNames: {
        content: "flex flex-col gap-2",
      },
      style: {
        "--border-radius": "calc(var(--radius)  + 4px)",
      } as React.CSSProperties,
    })
    await setCookieAction(data.email);
    router.push("/");
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
                    autoComplete="off"
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
                    4文字以上入力してください
                  </FieldDescription>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="password"
                      type={showPassword ? "password" : "text"}
                      aria-required
                      aria-invalid={fieldState.invalid}
                      aria-describedby="password-error"
                      autoComplete="off"
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
          <Button type="submit" form="login-form">
            アカウントを作成する
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
