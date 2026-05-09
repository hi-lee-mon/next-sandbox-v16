import "server-only";
import sql from "@/lib/auth/db";
import { verifySession } from "@/lib/auth/verify-session";
import { type Blog } from "../schema";
import { unstable_cache } from "next/cache";
import { cache } from "react";

export const BLOGS_CACHE_TAG = "getBlogs"

type BlogListItem = Blog & { author_name: string | null }

const cachedGetBlogs = unstable_cache(
  async (userId: string | null) => {
    return sql<BlogListItem[]>`
      SELECT blogs.*, "user".name AS author_name
      FROM blogs
      LEFT JOIN "user" ON blogs.user_id = "user".id
      WHERE blogs.deleted_at IS NULL
        AND (blogs.is_private = FALSE OR blogs.user_id = ${userId})
      ORDER BY blogs.created_at DESC
    `;
  },
  [BLOGS_CACHE_TAG],
  { tags: [BLOGS_CACHE_TAG] }
)

export const getBlogs = cache(async (): Promise<BlogListItem[]> => {
  const session = await verifySession()
  const blogs = await cachedGetBlogs(session?.user.id ?? null)
  return blogs.map(blog => ({ ...blog, created_at: new Date(blog.created_at) }))
})
