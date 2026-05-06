import 'server-only'
import { cookies } from "next/headers";

export const getToken = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  return token;
};
