# unstable_cache と Date 型のシリアライズ問題

## まず「シリアライズ」って何？

「シリアライズ」とは、JavaScriptのオブジェクトを**文字列に変換すること**です。
「デシリアライズ」はその逆で、文字列をオブジェクトに戻すことです。

一番身近な例は `JSON.stringify` / `JSON.parse` です。

```js
const obj = { name: "太郎", age: 20 }
const str = JSON.stringify(obj)  // → '{"name":"太郎","age":20}'
const obj2 = JSON.parse(str)     // → { name: "太郎", age: 20 }
```

これは問題ありません。でも **Date オブジェクト**だと話が変わります。

---

## Date オブジェクトは JSON で「文字列」になる

```js
const date = new Date("2025-01-01")
console.log(typeof date)              // "object"（Date オブジェクト）
console.log(date.toLocaleDateString()) // "2025/1/1"（動く）

const str = JSON.stringify(date)
// → '"2025-01-01T00:00:00.000Z"'   ← 文字列になった！

const restored = JSON.parse(str)
console.log(typeof restored)              // "string"（文字列のまま！）
console.log(restored.toLocaleDateString()) // エラー！文字列に toLocaleDateString はない
```

ポイントは **JSON.parse は Date を復元しない** という点です。
`JSON.stringify` で Date は文字列になりますが、`JSON.parse` はそれを「ただの文字列」として返します。Date オブジェクトには戻りません。

---

## unstable_cache の中で何が起きているか

`unstable_cache` はキャッシュデータをサーバーに保存するとき、内部で JSON を使って保存しています。

```
DB から取得
  ↓
created_at = new Date("2025-01-01")  ← Date オブジェクト
  ↓
【キャッシュに保存するとき JSON.stringify】
created_at = "2025-01-01T00:00:00.000Z"  ← 文字列になる
  ↓
【次のリクエストでキャッシュから取り出すとき JSON.parse】
created_at = "2025-01-01T00:00:00.000Z"  ← 文字列のまま！
  ↓
created_at.toLocaleDateString()  → エラー！
```

---

## なぜ「初回は動いて、リロードで壊れる」のか

```
1回目のリクエスト（キャッシュ MISS）
  → DB から直接データを取得
  → created_at は Date オブジェクトのまま
  → .toLocaleDateString() 動く ✅

データを JSON.stringify してキャッシュに保存
  → created_at が文字列になる

2回目のリクエスト（キャッシュ HIT）
  → DB には問い合わせず、キャッシュから取得
  → JSON.parse されたデータが返ってくる
  → created_at は文字列
  → .toLocaleDateString() エラー ❌
```

初回はDBから直接取ってくるので Date のまま動きますが、
2回目以降はキャッシュ（JSON）から取ってくるので文字列になっており壊れます。

補足として、RSCペイロードは独自のシリアライズ方法によりSCからCCにDateをオブジェクトのまま渡すことができます(特殊な方法でシリアライズしてCCでnew Dateしてデシリアライズを勝手にしてくれる)。しかしroute handlerはHTTPなのでそもそも初期表示時にエラーになります。

---

## 対処法

キャッシュから取り出した後に、明示的に `new Date()` でDate オブジェクトに戻す。

```typescript
export async function getSafeBlogs() {
  const session = await verifySession()
  const blogs = await cacheGetSafeBlogs(session?.user.id ?? null)
  // キャッシュから取り出した後に Date に戻す
  return blogs.map(blog => ({ ...blog, created_at: new Date(blog.created_at) }))
}
```

---

## まとめ

| 状況 | created_at の型 | .toLocaleDateString() |
|---|---|---|
| DB から直接取得 | Date オブジェクト | 動く |
| キャッシュ保存時（JSON.stringify） | 文字列に変換 | - |
| キャッシュから取得時（JSON.parse） | 文字列のまま | エラー |
| new Date() で変換後 | Date オブジェクト | 動く |

`unstable_cache` に限らず、**JSONを経由するとDate型は文字列になって戻ってこない**、というのはJavaScript全般の話です。APIのレスポンスやlocalStorageへの保存など、同じ問題が起きる場面は多いので覚えておきましょう。
