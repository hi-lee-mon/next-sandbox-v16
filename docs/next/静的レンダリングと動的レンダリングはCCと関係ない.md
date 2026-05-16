**Static / Dynamic Rendering はサーバー側の話**。
具体的には「Server Components がいつ実行されるか」を指す。

- **Static Rendering**: ビルド時（または revalidate 時）にサーバーで実行
- **Dynamic Rendering**: リクエスト時にサーバーで実行（`cookies()`, `headers()`, `searchParams` などの Dynamic API 使用や `force-dynamic` で切り替わる）

**Client Components はこの分類に関係ありません。** `"use client"` なコンポーネントはルートが static であっても dynamic であっても、常にブラウザで実行される。（もしくはサーバーで HTML として事前レンダリングされてハイドレーション）（事前レンダリングというのはSSRのことなので注意）

つまり整理すると：

|                   | Static Route                 | Dynamic Route                |
| ----------------- | ---------------------------- | ---------------------------- |
| Server Components | ビルド時に実行               | リクエスト時に実行           |
| Client Components | ブラウザで実行（変わらない） | ブラウザで実行（変わらない） |

Static / Dynamic の判定は **ルートセグメント単位**で行われ、その判定に使われるのはあくまでサーバー側の処理（Dynamic API の使用有無など）です。Client Components の有無は判定に影響しません。