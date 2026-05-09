"use server";
import sql from "@/lib/auth/db";
import { createBlogSchema, CreateBlogInput } from "../../schema";
import { verifySession } from "@/lib/auth/verify-session";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { BLOGS_CACHE_TAG } from "../../_data/get-blogs";

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

  revalidateTag(BLOGS_CACHE_TAG, { expire: 0 }) // 特定のキャッシュエントリを全てパージするため同じ関数で同じリソースを取得している場合はこれが最適（ただし、同じリソースを別の関数で取得している場合はキャッシュエントリが別なので更新されないことに注意）
  // revalidatePath("/blogs") //  /blogs にアクセスした全ユーザーのキャッシュを無効化
  // revalidatePath("/", "page") // これは/だけ
  // revalidatePath("/", "layout") // これは全ページ。パージする必要がないものもパージされる
  redirect("/blogs");
}
