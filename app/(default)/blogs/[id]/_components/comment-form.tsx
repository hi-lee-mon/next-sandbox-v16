"use client";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError } from "@/components/ui/field";
import { createCommentSchema, type CreateCommentInput } from "../schema";
import { createComment } from "../_action/create-comment";

export function CommentForm({ blogId }: { blogId: string }) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<CreateCommentInput>({
    resolver: standardSchemaResolver(createCommentSchema),
    defaultValues: { body: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  function onSubmit(data: CreateCommentInput) {
    startTransition(async () => {
      const result = await createComment(blogId, data);
      if (result?.error) {
        toast.error("コメントの投稿に失敗しました", { description: result.error });
      } else {
        form.reset();
        toast.success("コメントを投稿しました");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <Controller
        name="body"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <Textarea
              {...field}
              aria-required
              aria-invalid={fieldState.invalid}
              placeholder="コメントを入力してください"
              rows={3}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          コメントする{isPending && <Loader2 className="ml-2 animate-spin" />}
        </Button>
      </div>
    </form>
  );
}
