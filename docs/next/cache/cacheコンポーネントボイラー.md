```ts
const getBlogsTag = "getBlogs" // ここは設計によっては関数名ではなくリソース単位が良いかも。またスコープを考慮する場合はより複雑化する可能性がある。

export const getBlogs = cache(async()=>{
  "use cache"
  cacheTag(getBlogsTag)
  const res = await fetch("/blogs")
  return res.json()
})

export const preloadGetBlogs = (args: Parameters<typeof getBlogs>) => void getBlogs(...args);
export const updateGetBlogs = () => updateTag(getBlogsTag)
```