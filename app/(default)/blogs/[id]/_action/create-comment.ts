"use server";
import sql from "@/lib/auth/db";
import { createCommentSchema, type CreateCommentInput } from "../schema";
import { verifySession } from "@/lib/auth/verify-session";
import { updateTag } from "next/cache";
import { commentsCacheTag } from "../_data/get-comments";

export async function createComment(
  blogId: string,
  data: CreateCommentInput
): Promise<{ error: string } | void> {
  const session = await verifySession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const result = createCommentSchema.safeParse(data);
  if (!result.success) {
    return { error: "入力内容に誤りがあります" };
  }

  try {
    await sql`
      INSERT INTO comments (blog_id, user_id, body)
      VALUES (${blogId}, ${session.user.id}, ${result.data.body})
    `;
  } catch (error) {
    console.error("[createComment] DB insert failed:", error);
    return { error: "コメントの投稿に失敗しました" };
  }

  updateTag(commentsCacheTag(blogId));
}
