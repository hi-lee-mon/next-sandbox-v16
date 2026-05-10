import { getCommentsByBlogId } from "../_data/get-comments";
import { verifySession } from "@/lib/auth/verify-session";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { CommentForm } from "./comment-form";
import Link from "next/link";

export async function CommentsSection({ blogId }: { blogId: string }) {
  const [comments, session] = await Promise.all([
    getCommentsByBlogId(blogId),
    verifySession(),
  ]);

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center gap-2 border-b">
        <MessageSquare />
        <h2 className="text-xl font-bold">{comments.length}コメント</h2>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {session ? (
          <CommentForm blogId={blogId} />
        ) : (
          <p className="text-sm text-muted-foreground">
            コメントするには
            <Link href="/login" className="underline underline-offset-4 hover:text-primary mx-1">
              ログイン
            </Link>
            が必要です。
          </p>
        )}
        {comments.length > 0 && (
          <>
            <Separator />
            <section className="space-y-4">
              {comments.map((comment, index) => (
                <div key={comment.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {comment.author_name ?? "匿名"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {comment.created_at.toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                  {index < comments.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
