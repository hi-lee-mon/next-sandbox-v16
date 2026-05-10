"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createBlogSchema, CreateBlogInput, CreateBlogDTO } from "../schema";
import { createBlog } from "@/app/(default)/blogs/create/_action/create-blog";

export default function CreateBlogPage() {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<CreateBlogInput, unknown, CreateBlogDTO>({
    resolver: standardSchemaResolver(createBlogSchema),
    defaultValues: { title: "", body: "", isPrivate: false },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  function onSubmit(data: CreateBlogDTO) {
    startTransition(async () => {
      const result = await createBlog(data);
      if (result?.error) {
        toast.error("投稿に失敗しました", { description: result.error });
      }
    });
  }

  return (
    <Card className="w-full md:max-w-lg">
      <CardHeader>
        <CardTitle>新規投稿</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="create-blog-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="title">タイトル</FieldLabel>
                  <Input
                    {...field}
                    id="title"
                    aria-required
                    aria-invalid={fieldState.invalid}
                    placeholder="記事のタイトル"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="body"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="body">本文</FieldLabel>
                  <Textarea
                    {...field}
                    id="body"
                    aria-required
                    aria-invalid={fieldState.invalid}
                    placeholder="記事の本文"
                    rows={8}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="isPrivate"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal" className="items-center gap-2">
                  <Checkbox
                    id="isPrivate"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor="isPrivate" className="cursor-pointer font-normal">
                    非公開にする（自分だけが閲覧できます）
                  </FieldLabel>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal" className="flex justify-end">
          <Link href="/blogs" className={buttonVariants({ variant: "outline" })}>
            キャンセル
          </Link>
          <Button type="submit" form="create-blog-form" disabled={isPending}>
            投稿する{isPending && <Loader2 className="animate-spin" />}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
