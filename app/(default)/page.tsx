import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
  return (
    <div>ホームページ
      <br />
      <Link href="/about" className={buttonVariants({
        variant: "ghost",
        className: "text-blue-500 underline"
      })}>aboutへ</Link>
      <br />
      <Link href="/profile" className={buttonVariants({
        variant: "ghost",
        className: "text-blue-500 underline"
      })}>profileへ</Link>
      <br />
      <Link href="/blogs" className={buttonVariants({
        variant: "ghost",
        className: "text-blue-500 underline"
      })}>blogsへ</Link>
      <Link href="/contact" className={buttonVariants({
        variant: "ghost",
        className: "text-blue-500 underline"
      })}>contactへ</Link>
    </div>
  );
}
