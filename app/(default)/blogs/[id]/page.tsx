import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogById } from "../_data/get-blog-by-id";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BlogDetailPage({ params }: Props) {
  const { id } = await params;
  const blog = await getBlogById(id);

  if (!blog) notFound();

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/blogs" className={buttonVariants({ variant: "outline", size: "sm" })}>
          一覧に戻る
        </Link>
      </div>
      <article>
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">{blog.title}</h1>
          {blog.is_private && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              非公開
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          {blog.created_at.toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <p className="whitespace-pre-wrap leading-relaxed">{blog.body}</p>
      </article>
    </div>
  );
}
