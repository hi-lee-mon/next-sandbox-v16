import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute top-5 left-5">
        <Link href="/" className={buttonVariants({
          variant: "outline"
        })}>
          <ArrowLeft className="size-4" />
          戻る
        </Link>
      </div>
      {children}
    </main>
  )
}
