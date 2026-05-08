"use client"

import * as React from "react"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Controller, useForm } from "react-hook-form"

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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createUser } from "@/app/_data/user/create-user/create-user"
import { CreateUserInput, createUserInputSchema } from "@/app/_data/user/create-user/schema"

export default function CreateUserForm() {
  const [_, runAction, isPending] = React.useActionState(createUser, null)
  const form = useForm<CreateUserInput>({
    resolver: standardSchemaResolver(createUserInputSchema),
    defaultValues: {
      name: "",
      email: ""
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const handleSubmit = async (data: CreateUserInput) => {
    React.startTransition(async () => await runAction(data))
  }
  return (
    <Card className="w-full md:max-w-lg">
      <CardHeader>
        <CardTitle>ユーザ作成</CardTitle>
        {isPending && <p>loading///</p>}
      </CardHeader>
      <CardContent>
        <form id="login-form" onSubmit={form.handleSubmit(handleSubmit)}>
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
                    placeholder="山田太郎"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
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
            ユーザを作成する
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}