"use server";
import sql from "@/lib/auth/db";
import { createBlogSchema, CreateBlogDTO } from "../../schema";
import { verifySession } from "@/lib/auth/verify-session";
import { redirect } from "next/navigation";

export async function createBlog(data: CreateBlogDTO): Promise<{ error: string } | never> {
  const session = await verifySession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const result = createBlogSchema.safeParse(data);
  if (!result.success) {
    return { error: "入力内容に誤りがあります" };
  }

  try {
    await sql`
      INSERT INTO blogs (title, body, user_id, is_private)
      VALUES (${result.data.title}, ${result.data.body}, ${session.user.id}, ${result.data.isPrivate})
    `;
  } catch (_error) {
    return { error: "投稿に失敗しました" };
  }

  redirect("/blogs");
}
