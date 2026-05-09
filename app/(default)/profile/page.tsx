import Link from "next/link";

export default async function Page() {
  return (
    <div>プロフィール
      <br />
      <Link href="/" className="text-blue-500">ホームへ</Link>
    </div>
  )
}