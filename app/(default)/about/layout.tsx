import { health } from "@/app/_data/health"
import { forbidden } from "next/navigation"

export default async function Layout(props: LayoutProps<"/about">) {
  health("about-layout")
  await new Promise((r) => setTimeout(r, 3000))
  // const no = true
  // if (no) {
  //   forbidden()
  // }
  return (
    <>{props.children}</>
  )
}