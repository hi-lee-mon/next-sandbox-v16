import Link from "next/link";

export default async function Home() {
  return (
    <div>ホームページ
      <br />
      <Link href="/about" className="text-blue-500 border-b">aboutへ</Link>
      <br />
      <Link href="/profile" className="text-blue-500 border-b">profileへ</Link>
    </div>
  );
}
