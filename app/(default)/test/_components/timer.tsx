"use client"

import { useEffect, useState } from "react"

export default function Timer() {
  const [time, setTime] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => t + 1)
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="border-b">⌛【{time}秒】</div>
  )
}