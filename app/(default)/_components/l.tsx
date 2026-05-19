import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"

export const L = ({ children, href }: { children: React.ReactNode, href: string }) => {
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