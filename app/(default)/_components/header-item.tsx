import { Button } from "@/components/ui/button"
import { logout } from "@/lib/action/logout"
import { verifySession } from "@/lib/verify-session"
import { redirect } from "next/navigation"

export default async function HeaderItem() {
  const session = await verifySession()

  return (
    <div>
      <p>{session ? `【${session.user.name}】でログインしています` : "未ログイン"}</p>
      {
        session ?
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
    </div>
  )
}