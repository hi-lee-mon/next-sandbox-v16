"use client";
import { useState } from "react";
import { setCookieAction } from "./setCookie";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [name, setName] = useState("")

  return (
    <div className="mx-auto w-xs">
      <div className="border p-2">
        <h1 className="font-bold">ログイン画面</h1>
        <label>
          名前
          <input value={name} onChange={(e) => setName(e.target.value)} className="border mr-2" />
        </label>
        <button
          className="border px-2 py-1 rounded-2xl cursor-pointer"
          type="button"
          onClick={async () => {
            await setCookieAction(name);
            router.push("/");
          }}
        >
          ログイン
        </button>
      </div>
    </div>
  );
}
