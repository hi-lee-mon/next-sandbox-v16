import { health } from "@/app/_data/health"
import { verifySession } from "@/lib/verify-session";
import { unauthorized } from "next/navigation"



export default async function Layout(props: LayoutProps<"/profile">) {
  health("profile-layout")
  const session = await verifySession();

  if (!session) {
    // app/unauthorized.tsxを表示するnextの実験的機能
    unauthorized();
  }
  return (
    <>{props.children}</>
  )
}