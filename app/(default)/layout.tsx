import { redirect } from "next/navigation";
import { logout } from "../../lib/action/logout";
import { verifySession } from "../../lib/verify-session";
import { health } from "../_data/health";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function Layout(props: LayoutProps<"/">) {
  const session = await verifySession()
  const isLogin = !!session?.user
  health("default-layout")
  return (
    <div className="container mx-auto px-2">
      <header className="h-16 flex items-center border-b mb-9 container justify-between">
        <p className="font-bold text-2xl">Demo Nextjs v16</p>
        <ThemeToggle />
        <p>{isLogin ? `【${session!.user.name}】でログインしています` : "未ログイン"}</p>
        {
          isLogin ?
            (
              <form action={logout}>
                <Button type="submit">ログアウト</Button>
              </form>
            ) :
            (
              <form action={async () => {
                "use server"
                redirect("/login")
              }}>
                <Button type="submit">ログイン</Button>
              </form>
            )
        }
      </header>
      <main>
        {props.children}
      </main>
    </div>
  )
}
