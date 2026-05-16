import { ComponentProps } from "react"

type Props = ComponentProps<"p"> & {
  children: React.ReactNode
}

export default function SectionTitle(props: Props) {
  return (
    <h2 {...props} className="text-lg font-bold mb-4">
      {props.children}
    </h2>
  )
}