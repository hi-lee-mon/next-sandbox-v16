"use server";
import { auth } from "@/lib/auth"
import { LoginInput, loginSchema } from "./schema";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const login = async (body: LoginInput): Promise<{ error: string } | never> => {
  const result = loginSchema.safeParse(body)

  if (!result.success) {
    return { error: "ログインに失敗しました" }
  }

  try {
    await auth.api.signInEmail({
      body,
      headers: await headers(), // オプションだけど何かに使うらしい。何に使うのか調べたい。
    })
  } catch (error) {
    return { error: "ログインに失敗しました" }
  }

  // リダイレクトをtry catchの中に入れると機能しないので必ず外で呼び出すこと
  redirect("/")
}