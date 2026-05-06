"use server";

import { cookies } from "next/headers";

export type Session = {
  name: string
}

export async function setCookieAction(name: string) {
  const cookieStore = await cookies();

  const session = {
    name,
  } satisfies Session

  cookieStore.set("token", JSON.stringify(session));
}
