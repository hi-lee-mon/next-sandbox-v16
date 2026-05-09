import Link from "next/link";
import { getBlogs } from "../blogs/_data/get-blogs";

export default async function Page() {
  const blogs = await getBlogs()
  return (
    <div>プロフィール
      <br />
      <Link href="/" className="text-blue-500">ホームへ</Link>
      {blogs.length}
      {JSON.stringify(blogs)}
    </div>
  )
}