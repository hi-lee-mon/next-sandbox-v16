import { sleepServer } from "@/lib/server-sleep"

export default async function Page() {
  // 2秒間一番近くのloading.tsxが表示される
  await sleepServer(2000)
  return (
    <div>waitページ</div>
  )
}