import { z } from "zod";

export const blogSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  user_id: z.string().nullable(),
  is_private: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
});

export type Blog = z.infer<typeof blogSchema>;

export const createBlogSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  body: z.string().min(1, "本文を入力してください"),
  isPrivate: z.boolean().default(false),
})

export type CreateBlogInput = z.input<typeof createBlogSchema>
export type CreateBlogDTO = z.output<typeof createBlogSchema>