"use server"
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const deleteToken = async () => {
  console.error("hello")
  const cookieStore = await cookies();
  cookieStore.delete("token")
};
