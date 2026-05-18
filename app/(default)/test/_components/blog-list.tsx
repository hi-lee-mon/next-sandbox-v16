import { cacheLife, cacheTag } from "next/cache";
import { BLOGS_CACHE_TAG } from "../../blogs/_data/cache-tags";
import { getPublicBlogs } from "../../blogs/_data/get-public-blogs";

export default async function BlogList() {
  "use cache";
  cacheTag(BLOGS_CACHE_TAG);
  cacheLife({ stale: 0, revalidate: 15, expire: 300 });
  const blogs = await getPublicBlogs();

  return (
    <div className="max-w-2xl">
      {blogs.length === 0 ? (
        <p className="text-muted-foreground">投稿がありません</p>
      ) : (
        <ul className="flex flex-col gap-4 border">
          {blogs.map((blog) => (
            <li key={blog.id}>
              <h2>タイトル：{blog.title}</h2>
              <p>著者：{blog.author_name}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}