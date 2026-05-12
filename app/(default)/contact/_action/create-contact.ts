"use server";
import sql from "@/lib/auth/db";
import { createContactSchema, type CreateContactDTO } from "../schema";
import { updateTag } from "next/cache";
import { CONTACTS_CACHE_TAG } from "../cache-tags";

export async function createContact(data: CreateContactDTO) {
  const result = createContactSchema.safeParse(data);
  if (!result.success) {
    // TODO:戻り値の設計
    return { error: "入力内容に誤りがあります" };
  }

  try {
    await sql`
      INSERT INTO contacts (name, email, category, message)
      VALUES (
        ${result.data.name},
        ${result.data.email},
        ${result.data.category},
        ${result.data.message ?? null}
      )
    `;
  } catch (error) {
    // TODO:エラーハンドリングの設計
    console.error("[createContact] DB insert failed:", error);
    return { error: "送信に失敗しました" };
  }

  // TODO:キャッシュ更新設計の戦略
  updateTag(CONTACTS_CACHE_TAG)

  // TODO:nullでよいか？
  return null
}
