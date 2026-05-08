import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { getAllUsers } from "../_data/user/get-all-users/get-all-users";
import { Suspense } from "react";

export default async function Home() {
  const usersPromise = await getAllUsers()
  return (
    <div>ホームページ
      <br />

      <Link href="/about" className={buttonVariants({
        variant: "ghost"
      })}>aboutへ</Link>
      <br />
      <Link href="/profile" className="text-blue-500 border-b">profileへ</Link>
      {/* <Suspense fallback={"loading///"}>
        {usersPromise.then((users) => users[0].name)}
      </Suspense> */}
      {JSON.stringify(usersPromise)}
    </div>
  );
}
