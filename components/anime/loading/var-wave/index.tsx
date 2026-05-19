import style from "./index.module.css"
export default function VarWave() {
  return (
    <div className="">
      <div className="flex items-center gap-1.5">
        <span className={style.bar}></span>
        <span className={style.bar}></span>
        <span className={style.bar}></span>
        <span className={style.bar}></span>
        <span className={style.bar}></span>
      </div>
    </div>
  )
}