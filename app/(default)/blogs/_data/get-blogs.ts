import "server-only";
import sql from "@/lib/auth/db";
import { verifySession } from "@/lib/auth/verify-session";
import { type Blog } from "../schema";


export async function getBlogs(): Promise<Blog[]> {
  const session = await verifySession()
  return sql<Blog[]>`
    SELECT * FROM blogs
    WHERE deleted_at IS NULL
      AND (is_private = FALSE OR user_id = ${session?.user.id ?? null})
    ORDER BY created_at DESC
  `;
}
