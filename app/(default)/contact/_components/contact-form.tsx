"use client";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  createContactSchema,
  CONTACT_CATEGORIES,
  type CreateContactInput,
} from "../schema";
import { createContact } from "../_action/create-contact";

export default function ContactForm() {
  const [isPending, startTransition] = React.useTransition();
  const [submitted, setSubmitted] = React.useState(false);

  const form = useForm<CreateContactInput>({
    resolver: standardSchemaResolver(createContactSchema),
    defaultValues: {
      name: "",
      email: "",
      category: "general",
      message: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  function onSubmit(data: CreateContactInput) {
    startTransition(async () => {
      const result = await createContact(data);
      if (result?.error) {
        toast.error("送信に失敗しました", { description: result.error });
      } else {
        form.reset();
        setSubmitted(true);
        toast.success("お問い合わせを送信しました");
      }
    });
  }

  if (submitted) {
    return (
      <div className="rounded-lg border p-6 text-center space-y-2">
        <p className="text-lg font-medium">送信が完了しました</p>
        <p className="text-sm text-muted-foreground">
          お問い合わせありがとうございます。内容を確認の上、ご連絡いたします。
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          もう一度送信する
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="name">
              名前 <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              {...field}
              id="name"
              aria-required
              aria-invalid={fieldState.invalid}
              placeholder="山田 太郎"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="email">
              メールアドレス <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              {...field}
              id="email"
              type="email"
              aria-required
              aria-invalid={fieldState.invalid}
              placeholder="example@example.com"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="category"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="category">
              お問い合わせ種別 <span className="text-destructive">*</span>
            </FieldLabel>
            <select
              {...field}
              id="category"
              aria-required
              aria-invalid={fieldState.invalid}
              className={cn(
                "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                "disabled:cursor-not-allowed disabled:opacity-50",
                fieldState.invalid && "border-destructive ring-3 ring-destructive/20"
              )}
            >
              {Object.entries(CONTACT_CATEGORIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="message"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="message">メッセージ</FieldLabel>
            <Textarea
              {...field}
              id="message"
              aria-invalid={fieldState.invalid}
              placeholder="お問い合わせ内容を入力してください（任意）"
              rows={4}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          送信する
          {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </div>
    </form>
  );
}
