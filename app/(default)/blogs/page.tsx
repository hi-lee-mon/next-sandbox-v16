import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { getPublicBlogs } from "./_data/get-public-blogs";

export const dynamic = "force-static"
export const revalidate = 15;

export default async function BlogsPage() {
  const blogs = await getPublicBlogs();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ブログ一覧</h1>
        <Link href="/" className={buttonVariants()}>
          ホームへ戻る
        </Link>
        <Link href="/blogs/create" className={buttonVariants()}>
          新規投稿
        </Link>
      </div>
      {blogs.length === 0 ? (
        <p className="text-muted-foreground">投稿がありません</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {blogs.map((blog) => (
            <li key={blog.id}>
              <Link href={`/blogs/${blog.id}`} className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-lg">{blog.title}</h2>
                </div>
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{blog.body}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {blog.author_name ?? "不明"} · {blog.created_at.toLocaleDateString("ja-JP")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
