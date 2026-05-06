"use client"
import { verifySession } from "@/app/_data/verify-session";
import Link from "next/link";

export default function About() {
  return (
    <div>アバウト
      <br />
      <Link href="/" className="text-blue-500">ホームへ</Link>
    </div>
  );
}
