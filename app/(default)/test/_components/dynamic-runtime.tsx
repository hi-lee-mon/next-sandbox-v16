import { sleepServer } from "@/lib/server-sleep"
import { headers } from "next/headers"

type Props = {
  sec: number
  children: React.ReactNode
}

export default async function DynamicRuntime(props: Props) {
  await Promise.all([
    headers(),
    sleepServer(props.sec * 1000)
  ])
  return (
    <div>
      {props.children}
    </div>
  )
}