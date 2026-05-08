import { z } from "zod";

export const createUserInputSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createUserOutputSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
});

export type CreateUserOutput = z.infer<typeof createUserOutputSchema>;
