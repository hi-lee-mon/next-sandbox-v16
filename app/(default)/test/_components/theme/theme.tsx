import { useState } from "react"
import styles from "./style.module.css"
import { Button } from "@/components/ui/button"

export default function Theme() {
  const [theme, setTheme] = useState("light")
  const toggleTheme = () => {
    setTheme((t) => (t === "light" ? "dark" : "light"))
  }
  return (
    <div className={theme === "dark" ? styles.dark : ""}>
      <Button onClick={toggleTheme}>Toggle Theme</Button>
      <p className={styles.box}>Current theme: {theme}</p>
    </div>
  )
}