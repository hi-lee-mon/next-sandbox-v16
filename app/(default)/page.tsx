import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
  return (
    <div>ホームページ
      <br />
      <Link href="/about" className={buttonVariants({
        variant: "ghost"
      })}>aboutへ</Link>
      <br />
      <Link href="/profile" className="text-blue-500 border-b">profileへ</Link>
    </div>
  );
}
