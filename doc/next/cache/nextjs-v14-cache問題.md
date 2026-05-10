# Next.js v14 キャッシュの問題点

## 何が問題だったか

`page.tsx` に `getRandomTodo()` があるとき、「これはキャッシュされる？」という問いに答えるには **3箇所** を確認しなければならなかった。

---

## 確認しなければならない3箇所

### 1. 中身（関数の実装）
```ts
async function getRandomTodo() {
  // fetch のオプションで cache 設定を確認
  const res = await fetch('/api/todos', { cache: 'no-store' }); // ← キャッシュなし
}
```

### 2. 外側（ページ・レイアウトのセグメント設定）
```tsx
// page.tsx
export const dynamic = 'force-dynamic'; // ← これがあると中身の設定に関わらず非キャッシュ
export const revalidate = 0;            // ← これも同様
```

`cookies()` や `headers()` を呼んでいるだけでも動的レンダリングに切り替わる。

### 3. 親レイアウトからの伝播（特に厄介）
```
app/
  layout.tsx     ← ここで cookies() を呼ぶだけで
  dashboard/
    page.tsx     ← ここの getRandomTodo() も非キャッシュになる
```

**`page.tsx` だけ見ても判断できない。** 親の `layout.tsx` まで遡らないと正確には分からない。

### 4. Router Cache（クライアント側）
ブラウザのナビゲーション履歴でクライアント側にキャッシュされる。サーバー側のデータが更新されていても古い画面が見えることがある。

**v14 の問題点：staleTime が固定で設定できなかった**

| ルートの種類 | デフォルトの staleTime |
|---|---|
| 静的ルート | 5分 |
| 動的ルート | 30秒 |

この値は `next.config.js` で変更できず、プロジェクトの要件に合わせた調整が不可能だった。

```
例：商品の在庫情報を表示するページ
→ 動的ルートで 30秒 キャッシュされる
→ 在庫が変わっても 30秒 は古いデータが見える
→ でも短くできない
```

---

## まとめ

| 確認場所 | 見るべきもの |
|---|---|
| 関数の中身 | `fetch` の `cache` / `next.revalidate` オプション |
| そのページ | `export const dynamic` / `revalidate` / `fetchCache` |
| 親レイアウト | 同上 + `cookies()` / `headers()` の使用有無 |
| クライアント | Router Cache の有効期間 |

---

## Next.js 15 での改善

- `fetch` がデフォルトで**キャッシュされない**に変更（明示的にオプトインが必要）
- 挙動が予測しやすくなり、「外側を見なければならない」問題は大幅に緩和された
- Router Cache の `staleTimes` が `next.config.js` で設定可能になった

```js
// next.config.js（v15〜）
module.exports = {
  experimental: {
    staleTimes: {
      dynamic: 0,  // 動的ルートのキャッシュ時間（秒）
      static: 180, // 静的ルートのキャッシュ時間（秒）
    },
  },
};
```
