import { redirect } from "next/navigation";
import { deleteToken } from "../_action/delete-token";
import { verifySession } from "../_data/verify-session";
import { health } from "../_data/health";

export default async function Layout(props: LayoutProps<"/">) {
  const session = await verifySession()
  const isLogin = !!session?.name
  health("default-layout")
  return (
    <div className="container mx-auto px-2">
      <header className="h-16 flex items-center border-b mb-9 container justify-between">
        <p className="font-bold text-2xl">Demo Nextjs v16</p>
        <p>{isLogin ? `【${session.name}】でログインしています` : "未ログイン"}</p>
        {
          isLogin ?
            (
              <form action={deleteToken}>
                <button type="submit" className="border text-sm p-1 rounded-md">ログアウト</button>
              </form>
            ) :
            (
              <form action={async () => {
                "use server"
                redirect("/login")
              }}>
                <button type="submit" className="border text-sm p-1 rounded-md">ログイン</button>
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