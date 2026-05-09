# revalidateTag の使い方

## revalidateTag とは

`unstable_cache` や `fetch` でキャッシュしたデータを、**任意のタイミングで無効化する**ための関数です。

「ブログを投稿したら一覧のキャッシュを捨てて最新データを取得しなおす」といった場面で使います。

---

## 前提：tags の登録

`revalidateTag` で無効化するには、キャッシュ時に **`tags` を必ず登録**しておく必要があります。

`unstable_cache` の場合は **第3引数の `tags`** で指定します。

```typescript
// ✅ tags を登録している → revalidateTag で無効化できる
const cachedGetBlogs = unstable_cache(
  async (userId: string | null) => { /* DBクエリ */ },
  ["getBlogs"],          // ← keyParts（キャッシュの識別子）
  { tags: ["getBlogs"] } // ← tags（revalidateTag の対象ラベル）
)

// ❌ tags を登録していない → revalidateTag が効かない
const cachedGetBlogs = unstable_cache(
  async (userId: string | null) => { /* DBクエリ */ },
  ["getBlogs"]           // keyParts だけでは revalidateTag は効かない
)
```

### keyParts と tags の違い

| | `keyParts`（第2引数） | `tags`（第3引数） |
|---|---|---|
| 役割 | キャッシュエントリの識別子 | 無効化のためのラベル |
| `revalidateTag` と連動 | **しない** | **する** |

---

## 基本の使い方

```typescript
revalidateTag(tag: string, profile: string | { expire?: number }): void
```

```typescript
import { revalidateTag } from 'next/cache'

// Server Action 内で呼び出す
revalidateTag("getBlogs", { expire: 0 })
```

`revalidateTag` は **Server Action や Route Handler の中でのみ**使えます。Client Component からは呼べません。

---

## profile（第2引数）の選び方

第2引数 `profile` によって無効化の挙動が変わります。

### `{ expire: 0 }` — 即時無効化（作成・更新・削除後に推奨）

```typescript
revalidateTag("getBlogs", { expire: 0 })
```

キャッシュを**即座に破棄**します。次のリクエストで必ずDBから最新データを取得します。

ブログの投稿・編集・削除など、**ユーザーが変更直後に最新状態を見たい**場面に使います。

### `"max"` — Stale While Revalidate（緩やかな更新に推奨）

```typescript
revalidateTag("getBlogs", "max")
```

キャッシュを「古い」と**マーク**するだけです。次にそのページが訪問されたとき、一旦古いデータを返しながらバックグラウンドで新しいデータを取得します。

ニュースフィードや商品カタログなど、**多少古くても問題ない**場面に使います。

| | `{ expire: 0 }` | `"max"` |
|---|---|---|
| 無効化のタイミング | 即時 | 次回訪問時にバックグラウンドで |
| 変更直後の表示 | 最新データ | 古いデータ（その後更新） |
| 向いている用途 | 作成・更新・削除後 | キャッシュ更新の負荷を分散したい場面 |

> **注意**: 引数なし `revalidateTag("getBlogs")` は deprecated です。必ず第2引数を渡してください。

---

## 実装例：ブログ投稿後にキャッシュを無効化する

### キャッシュ側（タグを登録）

```typescript
// get-blogs.ts
export const BLOGS_CACHE_TAG = "getBlogs"

const cachedGetBlogs = unstable_cache(
  async (userId: string | null) => {
    return sql<Blog[]>`SELECT ...`
  },
  [BLOGS_CACHE_TAG],
  { tags: [BLOGS_CACHE_TAG] } // ← タグを登録
)
```

### 無効化側（Server Action）

```typescript
// create-blog.ts
import { revalidateTag } from 'next/cache'
import { BLOGS_CACHE_TAG } from '../_data/get-blogs'

export async function createBlog(data: CreateBlogInput) {
  await sql`INSERT INTO blogs ...`

  // 投稿後にキャッシュを即時無効化
  revalidateTag(BLOGS_CACHE_TAG, { expire: 0 })

  redirect("/blogs")
}
```

**ポイント：タグ名を定数で管理する**

タグ名をハードコードすると、変更時に抜け漏れが起きます。定数として export して使い回すことで一元管理できます。

---

## revalidatePath との違い

似た関数に `revalidatePath` がありますが、用途が異なります。

| | `revalidateTag` | `revalidatePath` |
|---|---|---|
| 無効化の単位 | タグが付いたキャッシュデータ | 特定のページやレイアウト |
| 複数ページへの影響 | タグを持つ全ページが対象 | 指定したパスのみ |
| 向いている用途 | データ単位の無効化 | 特定ページの強制再レンダリング |

同じデータが複数のページで使われている場合は `revalidateTag` が便利です。
