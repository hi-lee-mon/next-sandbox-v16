import { health } from "@/app/_data/health"
import { forbidden } from "next/navigation"

export default async function Layout(props: LayoutProps<"/profile">) {
  health("profile-layout")
  return (
    <>{props.children}</>
  )
}