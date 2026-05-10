import "server-only";
import sql from "@/lib/auth/db";
import { verifySession } from "@/lib/auth/verify-session";
import { BlogListItem } from "../schema";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { privateUserBlogsCacheTag } from "./cache-tags";

const fetchPrivateBlogs = (userId: string) =>
  unstable_cache(
    async (): Promise<BlogListItem[]> =>
      sql<BlogListItem[]>`
        SELECT blogs.*, "user".name AS author_name
        FROM blogs
        LEFT JOIN "user" ON blogs.user_id = "user".id
        WHERE blogs.deleted_at IS NULL
          AND blogs.is_private = TRUE
          AND blogs.user_id = ${userId}
        ORDER BY blogs.created_at DESC
      `,
    ["getPrivateBlogs", userId],
    { tags: [privateUserBlogsCacheTag(userId)] }
  )();

export const getPrivateBlogs = cache(async (): Promise<BlogListItem[]> => {
  const session = await verifySession();
  if (!session) return [];
  const blogs = await fetchPrivateBlogs(session.user.id);
  return blogs.map(b => ({ ...b, created_at: new Date(b.created_at) }));
});
