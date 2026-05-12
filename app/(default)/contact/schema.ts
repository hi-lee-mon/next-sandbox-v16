import { z } from "zod";

export const CONTACT_CATEGORIES = {
  general: "一般的なお問い合わせ",
  technical: "技術的な質問",
  billing: "料金について",
} as const;

export const contactCategorySchema = z.enum(["general", "technical", "billing"]);
export type ContactCategory = z.infer<typeof contactCategorySchema>;

export const contactSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  category: contactCategorySchema,
  message: z.string().nullable(),
  created_at: z.date(),
});
export type Contact = z.infer<typeof contactSchema>;

export const createContactSchema = z.object({
  name: z.string().min(1, "名前を入力してください").max(50, "50文字以内で入力してください"),
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("正しいメールアドレスを入力してください"),
  category: contactCategorySchema,
  message: z.string().max(500, "500文字以内で入力してください").optional(),
});

export type CreateContactInput = z.input<typeof createContactSchema>;
export type CreateContactDTO = z.output<typeof createContactSchema>;
