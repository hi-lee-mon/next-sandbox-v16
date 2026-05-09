import "server-only";
import sql from "@/lib/auth/db";
import { verifySession } from "@/lib/auth/verify-session";
import { type Blog } from "../schema";
import { unstable_cache } from "next/cache";


const getDangerousBlogsKey = ["blog"]

// 以下の方法だとSF(エンドポイント)を丸ごとキャッシュしているので
// このエンドポイントに対してのキャッシュがあったら、キャッシュを使ってしまう。つまりユーザIDの検証はしない
// is_privateの本来見えてはいけない情報が別のユーザに見えることになる
const _getDangerousBlogs = unstable_cache(async () => {
  // ユーザ判定をキャッシュする
  const session = await verifySession()
  return sql<Blog[]>`
    SELECT * FROM blogs
    WHERE deleted_at IS NULL
      AND (is_private = FALSE OR user_id = ${session?.user.id ?? null})
    ORDER BY created_at DESC
  `;
}, getDangerousBlogsKey)

export async function getDangerousBlogs() {
  const blogs = await _getDangerousBlogs()
  return blogs.map(blog => ({ ...blog, created_at: new Date(blog.created_at) }))
}

const cacheGetSafeBlogs = unstable_cache(
  async (userId: string | null) => {
    return sql<Blog[]>`
      SELECT * FROM blogs
      WHERE deleted_at IS NULL
        AND (is_private = FALSE OR user_id = ${userId})
      ORDER BY created_at DESC
    `;
  },
  ["blog"]
)

export async function getSafeBlogs() {
  const session = await verifySession()
  const blogs = await cacheGetSafeBlogs(session?.user.id ?? null)
  return blogs.map(blog => ({ ...blog, created_at: new Date(blog.created_at) }))
}