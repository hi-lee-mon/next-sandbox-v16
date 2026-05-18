"use client";
import { Button } from "@/components/ui/button";
import { updateBlogTag } from "../_action/update-blog-tag";
import { start } from "repl";
import { useTransition } from "react";

export default function BlogUpdateForm() {
  const [isPending, startTransition] = useTransition();
  return (
    <form onSubmit={
      async (e) => {
        e.preventDefault();
        startTransition(async () => {
          await updateBlogTag();
        });
      }
    }>
      <Button type="submit" disabled={isPending}>
        {isPending ? "更新中..." : "ブログを最新に更新"}
      </Button>
    </form>
  )
}