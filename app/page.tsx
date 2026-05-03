import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div>ホームページ
      <br />
      <Link href="/about" className="text-blue-500">aboutへ</Link>
    </div>
  );
}
