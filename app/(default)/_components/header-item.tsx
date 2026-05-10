"use client"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth/auth-client"
import { useRouter } from "next/navigation"

export default function HeaderItem() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  if (isPending) return null

  return (
    <div>
      <p>{session ? `【${session.user.name}】でログインしています` : "未ログイン"}</p>
      {session ? (
        <Button
          onClick={async () => {
            await authClient.signOut()
            router.refresh()
          }}
        >
          ログアウト
        </Button>
      ) : (
        <Button onClick={() => router.push("/login")}>ログイン</Button>
      )}
    </div>
  )
}