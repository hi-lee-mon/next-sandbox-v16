# unstable_cache の使い方

> **注意**: `unstable_cache` は Next.js 16 で `use cache` ディレクティブに置き換えられました。
> 新規実装では `use cache` を推奨しますが、仕組みを理解するために読む価値はあります。

---

## unstable_cache とは

データベースクエリや重い処理の結果をキャッシュし、**リクエストをまたいで再利用する**ための関数です。

```typescript
import { unstable_cache } from 'next/cache'

const getCachedData = unstable_cache(
  async () => { /* キャッシュしたい処理 */ },
  ['cache-key'],  // keyParts
  { revalidate: 60 }  // オプション（秒）
)

// 呼び出すときは返ってきた関数を実行する
const data = await getCachedData()
```

React の `cache()` と違い、**リクエストをまたいでキャッシュが持続します**。

| | React `cache()` | `unstable_cache` |
|---|---|---|
| 保持期間 | リクエスト単位 | リクエストをまたぐ |
| 用途 | 同一リクエスト内の重複排除 | 異なるリクエスト間のキャッシュ |

---

## キャッシュキーの仕組み

キャッシュキーは以下の組み合わせで自動的に決まります。

```
キャッシュキー = keyParts + 関数の文字列化 + 呼び出し時の引数
```

### 引数を渡すと自動でキャッシュが分かれる

```typescript
const getCachedBlogs = unstable_cache(
  async (userId: string | null) => {
    return db.query(userId)
  },
  ['blogs']
)

getCachedBlogs('user-a')  // キー: ['blogs', 'user-a']
getCachedBlogs('user-b')  // キー: ['blogs', 'user-b'] ← 別エントリ！
```

`useEffect` の依存配列と少し似ていますが、意味が違います。

| | `useEffect` の依存配列 | `unstable_cache` の引数 |
|---|---|---|
| 役割 | 値が変わったら再実行 | 引数ごとに別のキャッシュを持つ |
| イメージ | 変化の検知 | キャッシュの識別子 |

---

## 正しい書き方

### ✅ モジュールレベルで定義し、引数でユーザーを区別する

```typescript
// モジュール読み込み時に1回だけ定義する
const cacheGetBlogs = unstable_cache(
  async (userId: string | null) => {
    return sql<Blog[]>`
      SELECT * FROM blogs
      WHERE deleted_at IS NULL
        AND (is_private = FALSE OR user_id = ${userId})
      ORDER BY created_at DESC
    `;
  },
  ['blogs']
)

export async function getBlogs() {
  // verifySession() はキャッシュの外で呼ぶ
  const session = await verifySession()
  return cacheGetBlogs(session?.user.id ?? null)
}
```

**ポイント：**
- `unstable_cache` はモジュールレベルで一度だけ定義する（呼び出しのたびに生成しない）
- `verifySession()` などセッション確認はキャッシュ関数の**外側**で行う
- ユーザー固有の値は**引数として**キャッシュ関数に渡す

---

## やってはいけないパターン

### ❌ セッション確認をキャッシュ関数の内側に入れる

```typescript
// 危険！全ユーザーで同じキャッシュエントリを使ってしまう
export const getDangerousBlogs = unstable_cache(async () => {
  const session = await verifySession()  // ← キャッシュ内に入れてはいけない
  return sql<Blog[]>`
    SELECT * FROM blogs WHERE ...
      AND user_id = ${session?.user.id ?? null}
  `;
}, ['blogs'])  // ← 全員共通のキー
```

**何が起きるか：**

```
ユーザーA がアクセス
  → キャッシュ MISS → 関数実行 → verifySession() でAのIDを取得
  → Aの非公開ブログも含む結果を ['blogs'] で保存

ユーザーB がアクセス
  → キャッシュ HIT → 関数実行されない → verifySession() も呼ばれない
  → Aのデータがそのまま返る ← 情報漏洩 ❌
```

### ❌ 呼び出しのたびに unstable_cache を生成する

```typescript
export const getBlogs = async () => {
  const session = await verifySession()
  // 毎回新しいキャッシュ関数が生成される（非効率）
  return unstable_cache(async () => {
    return sql`...`
  }, [session?.user.id ?? ''])()
}
```

---

## Date 型の注意点

`unstable_cache` は内部で **JSON を使ってキャッシュを保存**します。
JSON のシリアライズ・デシリアライズで `Date` オブジェクトは文字列になり、復元されません。

```
キャッシュ保存時: created_at = Date オブジェクト → JSON.stringify → "2025-01-01T00:00:00.000Z"
キャッシュ取得時: JSON.parse → "2025-01-01T00:00:00.000Z" (文字列のまま)

blog.created_at.toLocaleDateString()  ← 文字列なのでエラー！
```

**対処法：キャッシュから取り出した後に `new Date()` で変換する**

```typescript
export async function getBlogs() {
  const session = await verifySession()
  const blogs = await cacheGetBlogs(session?.user.id ?? null)
  // Date に戻す
  return blogs.map(blog => ({ ...blog, created_at: new Date(blog.created_at) }))
}
```

---

## ドキュメントの注意書き

`unstable_cache` のドキュメントには以下の注意があります。

> "Accessing uncached data sources such as `headers` or `cookies` inside a cache scope is not supported."

`cookies()` や `headers()` を使う処理（= `verifySession()` など）は**キャッシュ関数の外で呼び出し**、必要な値だけ引数として渡す設計にしましょう。
