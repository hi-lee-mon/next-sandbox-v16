import { verifySession } from "@/app/_data/verify-session";
import { unauthorized } from "next/navigation";

export default async function Page() {
  const session = await verifySession();

  if (!session) {
    // app/unauthorized.tsxを表示するnextの実験的機能
    unauthorized();
  }
  return (
    <div>プロフィールページ</div>
  )
}