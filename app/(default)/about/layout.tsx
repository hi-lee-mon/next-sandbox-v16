import { health } from "@/lib/data/health"

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