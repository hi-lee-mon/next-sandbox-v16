import { randomUUID } from "node:crypto";

import { loadEnvConfig } from "@next/env";
import { expect, test } from "playwright/test";
import postgres from "postgres";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the BlogList E2E test.");
}

const sql = postgres(databaseUrl, { max: 1 });

test.afterAll(async () => {
  await sql.end({ timeout: 5 });
});

test("公開されたブログが表示され、非公開のブログは表示されないこと", async ({ page }) => {
  const runId = randomUUID();
  const publicTitle = `e2e-public-blog-${runId}`;
  const privateTitle = `e2e-private-blog-${runId}`;

  try {
    await sql`
      INSERT INTO blogs (title, body, is_private)
      VALUES
        (${publicTitle}, 'public body', FALSE),
        (${privateTitle}, 'private body', TRUE)
    `;
  } catch (error) {
    throw new Error(
      "Failed to seed blogs for E2E.",
      { cause: error },
    );
  }

  try {
    await page.goto("/test");

    await page.getByRole("button", { name: "ブログを最新に更新" }).click();

    await expect(page.getByText(`タイトル：${publicTitle}`)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(`タイトル：${privateTitle}`)).toHaveCount(0);
  } finally {
    await sql`
      DELETE FROM blogs
      WHERE title IN (${publicTitle}, ${privateTitle})
    `;
  }
});
