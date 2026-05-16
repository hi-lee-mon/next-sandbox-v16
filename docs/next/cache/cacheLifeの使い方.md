# Next.js の `use cache` と `cacheLife` 入門ガイド

## はじめに

このガイドでは、Next.js の新しいキャッシュ機能である `use cache` ディレクティブと `cacheLife` 関数の使い方を説明します。
今回のプロジェクトで行った変更を例に、なぜこれらを使うのか・どう書くのかを解説します。

---

## 背景：何が変わったのか

### 旧モデル（`cacheComponents: false` の頃）

以前は、ページのキャッシュ動作をルートセグメント設定で制御していました。

```ts
// app/(default)/blogs/page.tsx（旧）
export const dynamic = "force-static"; // 静的ページとして強制
export const revalidate = 15;          // 15秒ごとに再検証
```

- `dynamic = "force-static"` → ビルド時に静的 HTML を生成し、リクエストをキャッシュから返す
- `revalidate = 15` → 15秒後にバックグラウンドで再生成（ISR: Incremental Static Regeneration）

### 新モデル（`cacheComponents: true` の場合）

`next.config.ts` に `cacheComponents: true` を設定すると、**ルートセグメント設定は使えなくなります**。

```ts
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true, // これを有効にすると dynamic・revalidate が使えない
};
```

代わりに `use cache` と `cacheLife` を使って同じ動作を実現します。

---

## 新しい書き方

```tsx
// app/(default)/blogs/page.tsx（新）
import { cacheLife } from "next/cache";

export default async function BlogsPage() {
  "use cache";
  cacheLife({ stale: 0, revalidate: 15, expire: 300 });

  const blogs = await getPublicBlogs();
  // ...
}
```

たったこれだけです。順番に説明します。

---

## `"use cache"` ディレクティブとは

`"use cache"` は、関数やコンポーネントの**戻り値をキャッシュする**ための宣言です。

```tsx
export default async function BlogsPage() {
  "use cache"; // ← この関数の結果をキャッシュする
  // ...
}
```

`"use server"` や `"use client"` と同じ書き方で、関数の先頭に文字列として書きます。

### どこに書けるか

| 場所 | 効果 |
|------|------|
| ページ関数の先頭 | そのページ全体をキャッシュ |
| コンポーネント関数の先頭 | そのコンポーネントをキャッシュ |
| データ取得関数の先頭 | 取得したデータをキャッシュ |
| ファイルの先頭 | ファイル内の全エクスポート関数をキャッシュ |

---

## `cacheLife` とは

`cacheLife` は、キャッシュの**有効期間を設定する**関数です。`"use cache"` スコープの中でのみ使えます。

```tsx
import { cacheLife } from "next/cache";

"use cache";
cacheLife({ stale: 0, revalidate: 15, expire: 300 });
```

### 3つのパラメータ

```
         0秒          15秒            300秒
          |            |               |
キャッシュ生成 → stale期間 → revalidate → expire（強制失効）
```

| パラメータ | 単位 | 意味 |
|-----------|------|------|
| `stale` | 秒 | この時間内はキャッシュをそのまま返す（再検証しない） |
| `revalidate` | 秒 | この時間を過ぎたら、バックグラウンドで再検証を開始する |
| `expire` | 秒 | この時間を過ぎたら、キャッシュを強制的に無効化する |

今回の設定 `{ stale: 0, revalidate: 15, expire: 300 }` の動作：

1. キャッシュ生成直後から、15秒後に再検証対象になる（stale: 0 = 即座に stale 判定開始）
2. 15秒経過後にリクエストが来たら → 古いキャッシュを返しつつ、バックグラウンドで新しいデータを取得
3. 300秒（5分）経過後は → キャッシュが完全に失効し、次のリクエストで必ず新しいデータを取得

### プリセットプロファイルも使える

カスタムオブジェクトの代わりに、プリセット名も使えます。

```tsx
cacheLife('seconds'); // stale:0, revalidate:1s, expire:60s
cacheLife('minutes'); // stale:5m, revalidate:1m, expire:1h
cacheLife('hours');   // stale:5m, revalidate:1h, expire:1d
cacheLife('days');    // stale:5m, revalidate:1d, expire:1w
cacheLife('weeks');   // stale:5m, revalidate:1w, expire:30d
cacheLife('max');     // stale:5m, revalidate:30d, expire:ほぼ無期限
```

---

## 重要な注意点：`expire` は5分以上にする

`expire` が5分（300秒）未満の場合、そのキャッシュは **"short-lived"（短命）** とみなされ、**静的シェルから除外されて動的なレンダリングになります**。

```tsx
// NG: expire が 60秒 → short-lived 扱いでプリレンダリングされない
cacheLife({ revalidate: 15, expire: 60 });

// OK: expire が 300秒（5分）以上 → 静的シェルに含まれる
cacheLife({ revalidate: 15, expire: 300 });
```

旧モデルの `dynamic = "force-static"` と同じ「静的に生成する」動作を維持するには、`expire: 300` 以上が必須です。

---

## 旧モデルとの対応表

| 旧設定 | 新設定 | 説明 |
|--------|--------|------|
| `dynamic = "force-static"` | `"use cache"` | ページを静的シェルにキャッシュ |
| `revalidate = 15` | `revalidate: 15` | 15秒ごとにバックグラウンド再検証 |
| —（暗黙の動作） | `stale: 0` | stale 判定を即座に開始 |
| —（なし） | `expire: 300` | short-lived 除外を避けるための最低限の値 |

---

## データレベルでのキャッシュ（応用）

ページ全体ではなく、**データ取得関数だけをキャッシュ**することもできます。

```tsx
// app/(default)/blogs/_data/get-public-blogs.ts
import { cacheLife } from "next/cache";

export async function getPublicBlogs() {
  "use cache";
  cacheLife("minutes"); // 1分ごとに再検証
  return db.query("SELECT * FROM blogs WHERE is_private = false");
}
```

こうすると、複数のページから同じ関数を呼んでも、キャッシュは一度だけ生成されます。

---

## まとめ

- `cacheComponents: true` を有効にすると、`dynamic` や `revalidate` のルートセグメント設定は**使えなくなる**
- 代わりに `"use cache"` + `cacheLife` でキャッシュを制御する
- `cacheLife` の3つのパラメータ（`stale` / `revalidate` / `expire`）でキャッシュライフサイクルを細かく設定できる
- **静的シェルに含めるには `expire: 300` 以上が必須**（short-lived 除外ルールを避けるため）
