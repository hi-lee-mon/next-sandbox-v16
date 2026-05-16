import { Loader2 } from "lucide-react";

export default function F({ l = "読み込み中" }: { l?: string }) {
  return (
    <div className="flex"><Loader2 className="animate-spin size-4" />{l}</div>
  )
}