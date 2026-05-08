"use server";

import sql from "@/lib/db";
import {
  createUserInputSchema,
  createUserOutputSchema,
  type CreateUserInput,
  type CreateUserOutput,
} from "./schema";

export async function createUser(_: CreateUserOutput | null, formData: CreateUserInput): Promise<CreateUserOutput> {
  const parsed = createUserInputSchema.safeParse(formData);

  if (!parsed.success) {
    throw new Error(`Invalid input: ${parsed.error.message}`);
  }

  const { name, email } = parsed.data;

  const rows = await sql`
    INSERT INTO users (name, email)
    VALUES (${name}, ${email})
    RETURNING id, name, email
  `;

  const result = createUserOutputSchema.safeParse(rows[0]);

  if (!result.success) {
    throw new Error(`Failed to create user: ${result.error.message}`);
  }

  return result.data;
}
