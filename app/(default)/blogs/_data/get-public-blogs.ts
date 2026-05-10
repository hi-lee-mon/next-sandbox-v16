import "server-only";
import sql from "@/lib/auth/db";
import { BlogListItem } from "../schema";
import { unstable_cache } from "next/cache";
import { BLOGS_CACHE_TAG } from "./cache-tags";

const cacheGetPublicBlogs = unstable_cache(
  async (): Promise<BlogListItem[]> => {
    return sql<BlogListItem[]>`
      SELECT blogs.*, "user".name AS author_name
      FROM blogs
      LEFT JOIN "user" ON blogs.user_id = "user".id
      WHERE blogs.deleted_at IS NULL
        AND blogs.is_private = FALSE
      ORDER BY blogs.created_at DESC
    `;
  },
  ["getPublicBlogs"],
  { tags: [BLOGS_CACHE_TAG] }
);

export const getPublicBlogs = async () => {
  const blogs = await cacheGetPublicBlogs()
  return blogs.map(b => ({ ...b, created_at: new Date(b.created_at) }));
}
