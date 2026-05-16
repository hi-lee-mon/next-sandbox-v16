"use client"
import { Button, Input } from "@base-ui/react";
import { useState } from "react";

export default function Interaction() {
  const [input, setInput] = useState("")
  return (
    <form onSubmit={async (e) => {
      e.preventDefault()
    }}>
      <Input className="border" value={input} onChange={(e) => { setInput(e.target.value) }} />
      <Button type="submit">送信</Button>
    </form>
  )
}