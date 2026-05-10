"use server";
import sql from "@/lib/auth/db";
import { createBlogSchema, CreateBlogInput } from "../../schema";
import { verifySession } from "@/lib/auth/verify-session";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { BLOGS_CACHE_TAG, privateUserBlogsCacheTag } from "../../_data/cache-tags";

export async function createBlog(data: CreateBlogInput): Promise<{ error: string } | never> {
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
  } catch (error) {
    console.error("[createBlog] DB insert failed:", error);
    return { error: "投稿に失敗しました" };
  }

  if (result.data.isPrivate) {
    revalidateTag(privateUserBlogsCacheTag(session.user.id), { expire: 0 });
    redirect("/profile");
  } else {
    revalidateTag(BLOGS_CACHE_TAG, { expire: 0 });
    redirect("/blogs");
  }
}
