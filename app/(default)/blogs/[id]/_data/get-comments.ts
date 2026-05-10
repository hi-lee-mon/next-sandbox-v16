import "server-only";
import sql from "@/lib/auth/db";
import { type Comment } from "../schema";

export async function getCommentsByBlogId(blogId: string): Promise<Comment[]> {
  const rows = await sql<Comment[]>`
    SELECT comments.*, "user".name AS author_name
    FROM comments
    LEFT JOIN "user" ON comments.user_id = "user".id
    WHERE comments.blog_id = ${blogId}
      AND comments.deleted_at IS NULL
    ORDER BY comments.created_at ASC
  `;
  return rows.map((row) => ({ ...row, created_at: new Date(row.created_at) }));
}
