import { sleepServer } from "@/lib/server-sleep";

type Props = {
  sec: number
  children: React.ReactNode
}

export default async function DynamicCache(props: Props) {
  "use cache"
  await sleepServer(props.sec * 1000);
  return (
    <div>
      {props.children}
    </div>
  )
}