import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogById } from "../_data/get-blog-by-id";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { CommentsSection } from "./_components/comments-section";

type Props = {
  params: Promise<{ id: string }>;
};

// generateStaticParams でビルド時静的化 + コメント欄をSC動的レンダリングにすることは、
// PPR なしには実現できない。CommentsSection 内の verifySession() が headers() を呼ぶため、
// ルート全体が動的レンダリングに引き込まれ、generateStaticParams の効果が失われる。
// 回避策: next.config.ts で cacheComponents: true を有効にすると PPR が適用され、
// ブログ本文（静的シェル）はビルド時に生成され、<Suspense> 内の動的部分だけがリクエスト時に解決される。
// 現在は unstable_cache + <Suspense> で実質同等の挙動を実現している。
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
