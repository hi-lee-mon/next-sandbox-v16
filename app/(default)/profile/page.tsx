import { verifySession } from "@/lib/verify-session";
import Link from "next/link";
import { unauthorized } from "next/navigation";

export default async function Page() {
  const session = await verifySession();

  if (!session) {
    // app/unauthorized.tsxを表示するnextの実験的機能
    unauthorized();
  }
  return (
    <div>プロフィール
      <br />
      <Link href="/" className="text-blue-500">ホームへ</Link>
    </div>
  )
}