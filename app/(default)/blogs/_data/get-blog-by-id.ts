import "server-only";
import sql from "@/lib/auth/db";
import { z } from "zod";
import { type Blog } from "../schema";
import { unstable_cache } from "next/cache";

const uuidSchema = z.uuidv4()

export const BLOG_DETAIL_CACHE_TAG = "blog-detail";

const cachedGetBlogById = unstable_cache(
  async (id: string) => {
    return sql<Blog[]>`
      SELECT * FROM blogs
      WHERE id = ${id}
        AND deleted_at IS NULL
        AND is_private = FALSE
      LIMIT 1
    `;
  },
  ["getBlogById"],
  { tags: [BLOG_DETAIL_CACHE_TAG] }
);

export async function getBlogById(id: string): Promise<Blog | null> {
  if (!uuidSchema.safeParse(id).success) return null;

  const rows = await cachedGetBlogById(id);
  if (!rows[0]) return null;

  return { ...rows[0], created_at: new Date(rows[0].created_at) };
}
