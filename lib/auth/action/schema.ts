import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("メールアドレスの形式で入力してください（例: name@example.com）"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
})

export type LoginInput = z.input<typeof loginSchema>

const passwordSchema = z.string().min(8, "パスワードは8文字以上で入力してください")

export const signUpSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  email: z.email("メールアドレスの形式で入力してください（例: name@example.com）"),
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"],
})

export type SignUpInput = z.input<typeof signUpSchema>