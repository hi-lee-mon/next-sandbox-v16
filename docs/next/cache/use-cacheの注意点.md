# `"use cache"` の注意点

## はじめに

`"use cache"` は Next.js 15 以降で使えるキャッシュディレクティブです。関数やコンポーネントの先頭に書くだけでキャッシュ対象になります。`unstable_cache` の後継として位置づけられており、よりシンプルに書けるのが特徴です。

```ts
import { cacheTag, cacheLife } from "next/cache";

export async function getPublicBlogs() {
  "use cache";
  cacheTag("blogs");
  cacheLife({ stale: 0, revalidate: 60, expire: 3600 });

  return db.query("...");
}
```

---

## 注意点 1: キャッシュキーは「引数」で決まる

`"use cache"` を付けた関数は、**引数の値をキャッシュキーとして自動的に使います**。

```ts
// userId が違えば、別のキャッシュエントリになる
fetchPrivateBlogs("user-abc"); // キャッシュキー = fetchPrivateBlogs("user-abc")
fetchPrivateBlogs("user-xyz"); // キャッシュキー = fetchPrivateBlogs("user-xyz")
```

### 引数なしでユーザー固有データを取ると危険

引数なしの `"use cache"` 関数の中で `cookies()` や `verifySession()` を使ってユーザー情報を取ろうとすると、**全ユーザーが同じキャッシュエントリを共有してしまう**可能性があります。

```ts
// ❌ 危険: 最初にアクセスしたユーザーのデータが全員に返る
export async function getMyBlogs() {
  "use cache";
  const session = await verifySession(); // 引数で渡していない
  return db.query("... WHERE user_id = ?", session.user.id);
}
```

### 正しいパターン: userId を引数として渡す

セッションの取得とDB取得を分離します。

```ts
// ✅ 正しい: userId を引数にすることでユーザーごとにキャッシュが分かれる
async function fetchPrivateBlogs(userId: string) {
  "use cache";
  cacheTag(`blogs-private-${userId}`);
  return db.query("... WHERE user_id = ?", userId);
}

export async function getPrivateBlogs() {
  // ← "use cache" は付けない
  const session = await verifySession(); // セッション取得はここで
  if (!session) return [];
  return fetchPrivateBlogs(session.user.id); // userId を引数で渡す
}
```

---

## 注意点 2: ランタイム API と共存できない

`cookies()` や `headers()` などのランタイム API を参照する関数には `"use cache"` を付けられません。

```ts
// ❌ エラー: "use cache" スコープ内で cookies() を呼んでいる
export async function getPrivateBlogs() {
  "use cache";
  const session = await verifySession(); // 内部で cookies() を使っている → エラー
}
```

`verifySession()` のように cookies を使う処理は `"use cache"` の外に出す必要があります（注意点 1 の正しいパターンを参照）。

---

## 注意点 3: ページにも `cacheTag` を付ける

`"use cache"` はネストして使えますが、**外側のキャッシュが有効な間は内側のキャッシュ無効化が画面に反映されません**。

```
[blogs/page.tsx] "use cache" ← ここのキャッシュが有効な間、古いHTMLが返り続ける
  └── [getPublicBlogs()] "use cache" + cacheTag("blogs")
        └── DB
```

`updateTag("blogs")` を呼んで `getPublicBlogs` のキャッシュを無効化しても、ページ自体のHTMLキャッシュが生きていると古い画面が返ります。

### 対策: ページにも同じ `cacheTag` を付ける

```ts
// blogs/page.tsx
export default async function BlogsPage() {
  "use cache";
  cacheTag("blogs"); // ← ページにも付ける
  cacheLife({ stale: 0, revalidate: 15, expire: 300 });

  const blogs = await getPublicBlogs();
  ...
}
```

これにより `updateTag("blogs")` 一発でページとデータ取得の両方が無効化されます。

---

## 注意点 4: `updateTag` は Server Action 専用

キャッシュを即座に無効化する `updateTag` は **Server Action の中でしか呼べません**。

| 関数 | 使える場所 | 動作 |
|------|-----------|------|
| `updateTag` | Server Action のみ | 即座に無効化（ユーザーが自分の変更をすぐ確認できる） |
| `revalidateTag` | Server Action / Route Handler | stale-while-revalidate（少し遅延がある） |

投稿・更新・削除など「操作した本人がすぐ結果を見る」ケースでは `updateTag` が適切です。

```ts
// Server Action
export async function createBlog(data: CreateBlogInput) {
  "use server";
  await db.insert(...);

  updateTag("blogs"); // 即座に無効化
  redirect("/blogs");
}
```

---

## まとめ

| チェック項目 | 内容 |
|-------------|------|
| ユーザー固有データ | `userId` など識別子を引数で渡す |
| `cookies()` / `headers()` | `"use cache"` の外で呼ぶ |
| ページのキャッシュ | データ関数と同じ `cacheTag` をページにも付ける |
| 即時無効化 | `updateTag` は Server Action 内で使う |
