import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import SectionTitle from "./_components/section-title";

const L = ({ children, href }: { children: React.ReactNode, href: string }) => {
  return (
    <div>
      <Link href={href} className={buttonVariants({
        variant: "ghost",
        className: "text-blue-500 underline"
      })}>
        {children}
      </Link>
      <br />
    </div>
  )
}

export default async function Home() {
  return (
    <div>
      <SectionTitle>メインページ</SectionTitle>
      <L href="/about">aboutへ</L>
      <L href="/profile">profileへ</L>
      <L href="/blogs">blogsへ</L>
      <L href="/contact">contactへ</L>
      <L href="/test">testへ</L>
    </div>
  );
}
