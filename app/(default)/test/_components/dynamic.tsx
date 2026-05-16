import { sleepServer } from "@/lib/server-sleep";

type Props = {
  sec: number
  children: React.ReactNode
}

export default async function Static(props: Props) {
  await sleepServer(props.sec * 1000);
  return (
    <div>
      {props.children}
    </div>
  )
}