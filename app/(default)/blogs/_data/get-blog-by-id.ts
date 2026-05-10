import "server-only";
import sql from "@/lib/auth/db";
import { z } from "zod";
import { type Blog } from "../schema";
import { cacheTag, cacheLife } from "next/cache";

const uuidSchema = z.uuidv4();

export const BLOG_DETAIL_CACHE_TAG = "blog-detail";

async function cachedGetBlogById(id: string): Promise<Blog | null> {
  "use cache";
  cacheTag(BLOG_DETAIL_CACHE_TAG);
  cacheLife("max");

  const rows = await sql<Blog[]>`
    SELECT * FROM blogs
    WHERE id = ${id}
      AND deleted_at IS NULL
      AND is_private = FALSE
    LIMIT 1
  `;
  if (!rows[0]) return null;

  return { ...rows[0], created_at: new Date(rows[0].created_at) };
}

export async function getBlogById(id: string): Promise<Blog | null> {
  if (!uuidSchema.safeParse(id).success) return null;
  return cachedGetBlogById(id);
}
