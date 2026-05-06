import Link from "next/link";

export default function UnauthorizedPage() {

  return (
    <main>
      <p>ログインが必要です</p>
      <Link href="/login" className="text-blue-500 border-b">ログインページに進む</Link>
    </main>
  );
}
