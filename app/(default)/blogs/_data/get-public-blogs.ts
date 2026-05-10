import "server-only";
import sql from "@/lib/auth/db";
import { BlogListItem } from "../schema";
import { cacheTag, cacheLife } from "next/cache";
import { BLOGS_CACHE_TAG } from "./cache-tags";

export async function getPublicBlogs(): Promise<BlogListItem[]> {
  "use cache";
  cacheTag(BLOGS_CACHE_TAG);
  cacheLife({ stale: 0, revalidate: 60, expire: 3600 });

  const blogs = await sql<BlogListItem[]>`
    SELECT blogs.*, "user".name AS author_name
    FROM blogs
    LEFT JOIN "user" ON blogs.user_id = "user".id
    WHERE blogs.deleted_at IS NULL
      AND blogs.is_private = FALSE
    ORDER BY blogs.created_at DESC
  `;
  return blogs.map((b) => ({ ...b, created_at: new Date(b.created_at) }));
}
