type Props = {
  children: React.ReactNode
}

export default function Static(props: Props) {

  return (
    <div>
      {props.children}
    </div>
  )
}