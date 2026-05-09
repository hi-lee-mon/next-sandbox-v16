import "server-only";
import sql from "@/lib/auth/db";
import { verifySession } from "@/lib/auth/verify-session";
import { z } from "zod";
import { type Blog } from "../schema";

const uuidSchema = z.string().uuid();

export async function getBlogById(id: string): Promise<Blog | null> {
  if (!uuidSchema.safeParse(id).success) return null;

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
