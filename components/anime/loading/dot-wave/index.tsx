import style from "./index.module.css"
export default function DtoWave() {
  return (
    <div className="">
      <div className="flex items-center gap-1.5">
        <span className={style.dot}></span>
        <span className={style.dot}></span>
        <span className={style.dot}></span>
      </div>
    </div>
  )
}