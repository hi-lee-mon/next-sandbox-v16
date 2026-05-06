import 'server-only'
import { getToken } from "./get-token";
import { Session } from '../login/setCookie';

export const verifySession = async () => {
  const token = await getToken();

  if (!token) {
    return null;
  }
  return JSON.parse(token) as Session
}
