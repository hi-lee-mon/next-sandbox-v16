import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.string().min(1, "コメントを入力してください"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export type Comment = {
  id: string;
  blog_id: string;
  user_id: string | null;
  body: string;
  created_at: Date;
  author_name: string | null;
};
