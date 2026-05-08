import { z } from "zod";

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const usersSchema = z.array(userSchema)

export type Users = z.infer<typeof usersSchema>;
