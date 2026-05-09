"use server";
import { auth } from "@/lib/auth"
import { LoginInput, SignUpInput, signUpSchema } from "./schema";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const signUp = async (body: SignUpInput): Promise<{ error: string } | never> => {
  const result = signUpSchema.safeParse(body)

  if (!result.success) {
    return { error: "登録に失敗しました" }
  }

  try {
    await auth.api.signUpEmail({
      body,
      headers: await headers(), // オプションだけど何かに使うらしい。何に使うのか調べたい。
    })
  } catch (_error) {
    return { error: "登録に失敗しました" }
  }

  redirect("/")
}