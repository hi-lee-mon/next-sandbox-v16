import "server-only";

import sql from "@/lib/auth/db";
import { verifySession } from "@/lib/auth/verify-session";
import { BlogListItem } from "../schema";
import { cacheTag, cacheLife } from "next/cache";
import { privateUserBlogsCacheTag } from "./cache-tags";

async function fetchPrivateBlogs(userId: string): Promise<BlogListItem[]> {
  "use cache";
  cacheTag(privateUserBlogsCacheTag(userId));
  cacheLife({ stale: 0, revalidate: 60, expire: 3600 });

  const blogs = await sql<BlogListItem[]>`
    SELECT blogs.*, "user".name AS author_name
    FROM blogs
    LEFT JOIN "user" ON blogs.user_id = "user".id
    WHERE blogs.deleted_at IS NULL
      AND blogs.is_private = TRUE
      AND blogs.user_id = ${userId}
    ORDER BY blogs.created_at DESC
  `;
  return blogs.map((b) => ({ ...b, created_at: new Date(b.created_at) }));
}

export async function getPrivateBlogs(): Promise<BlogListItem[]> {
  const session = await verifySession();
  if (!session) return [];
  return fetchPrivateBlogs(session.user.id);
}
