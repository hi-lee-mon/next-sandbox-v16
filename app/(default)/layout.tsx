import { redirect } from "next/navigation";
import { deleteToken } from "../_action/delete-token";
import { verifySession } from "../_data/verify-session";
import { health } from "../_data/health";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function Layout(props: LayoutProps<"/">) {
  // TODO：layoutでcookieにアクセスしているため全体的にdynamicになっている。cookie取得をCCに寄せることで解決は可能
  const session = await verifySession()
  const isLogin = !!session?.name
  health("default-layout")
  return (
    <div className="container mx-auto px-2">
      <header className="h-16 flex items-center border-b mb-9 container justify-between">
        <p className="font-bold text-2xl">Demo Nextjs v16</p>
        <ThemeToggle />
        <p>{isLogin ? `【${session.name}】でログインしています` : "未ログイン"}</p>
        {
          isLogin ?
            (
              <form action={deleteToken}>
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