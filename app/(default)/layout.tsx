import { health } from "../_data/health";
import { ThemeToggle } from "@/components/theme-toggle";
import HeaderItem from "./_components/header-item";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function Layout(props: LayoutProps<"/">) {
  health("default-layout")
  return (
    <div className="container mx-auto px-2">
      <header className="h-16 flex items-center border-b mb-9 container justify-between">
        <p className="font-bold text-2xl">Demo Nextjs v16</p>
        <ThemeToggle />
        <Suspense fallback={<Loader2 className="size-4 animate-spin" />}>
          <HeaderItem />
        </Suspense>
      </header>
      <main>
        {props.children}
      </main>
    </div>
  )
}
