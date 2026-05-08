import sql from "@/lib/db";
import { usersSchema } from "./schema";

export async function getAllUsers() {
  const users = await sql`SELECT id, name FROM users`;

  const result = usersSchema.safeParse(users)

  if (!result.success) {
    throw new Error(`Failed to fetch users: ${result.error.message}`)
  }

  return result.data
}