import { verifySession } from "@/app/_data/verify-session";
import Link from "next/link";
import { unauthorized } from "next/navigation";
import CreateUserForm from "./_components/create-user-form";

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
      <CreateUserForm />
    </div>
  )
}