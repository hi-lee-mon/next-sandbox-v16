import "server-only";
import sql from "@/lib/db";
import { verifySession } from "@/lib/verify-session";
import { type Blog } from "../schema";

export async function getBlogById(id: string): Promise<Blog | null> {
  const session = await verifySession();
  const rows = await sql<Blog[]>`
    SELECT * FROM blogs
    WHERE id = ${id}
      AND deleted_at IS NULL
      AND (is_private = FALSE OR user_id = ${session?.user.id ?? null})
    LIMIT 1
  `;
  return rows[0] ?? null;
}
