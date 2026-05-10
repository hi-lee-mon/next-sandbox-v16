import Link from "next/link";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/verify-session";
import { getPrivateBlogs } from "../blogs/_data/get-private-blogs";
import { buttonVariants } from "@/components/ui/button";

export default async function Page() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const blogs = await getPrivateBlogs();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">プロフィール</h1>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          ホームへ戻る
        </Link>
      </div>
      <p className="text-muted-foreground mb-8">{session.user.name ?? session.user.email}</p>

      <h2 className="text-xl font-semibold mb-4">非公開ブログ</h2>
      {blogs.length === 0 ? (
        <p className="text-muted-foreground">非公開の投稿がありません</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {blogs.map((blog) => (
            <li key={blog.id}>
              <Link
                href={`/blogs/${blog.id}`}
                className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{blog.title}</h3>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    非公開
                  </span>
                </div>
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{blog.body}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {blog.created_at.toLocaleDateString("ja-JP")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
