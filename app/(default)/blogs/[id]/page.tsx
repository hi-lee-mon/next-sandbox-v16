import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogById } from "../_data/get-blog-by-id";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { CommentsSection } from "./_components/comments-section";
import { getPublicBlogs } from "../_data/get-public-blogs";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const blogs = await getPublicBlogs();
  return blogs.map((blog) => ({ id: blog.id }));
}

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
      <Suspense fallback={<CommentsLoadingFallback />}>
        <CommentsSection blogId={id} />
      </Suspense>
    </div>
  );
}

function CommentsLoadingFallback() {
  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center gap-2 border-b">
        <MessageSquare />
        <h2 className="text-xl font-bold">コメント</h2>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-1/3 ml-auto" />
        </div>
      </CardContent>
    </Card>
  );
}
