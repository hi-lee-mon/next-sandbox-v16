# RSC Page Architecture And Test Plan

## 基本方針

Next.js App Router / React Server Components 前提では、最初からすべての画面を多層に固定しない。

基本形は次の 3 層から始める。

```txt
app/.../page.tsx
  -> route adapter

features/xxx/XxxPage.tsx
  -> Server Component の orchestration

features/xxx/XxxView.tsx
  -> presentational UI
```

必要になった場合だけ、`XxxContainer.tsx` と `XxxLayout.tsx` を追加する。

```txt
features/xxx/XxxContainer.tsx
  -> client state / interaction / mutation が必要な場合だけ追加

features/xxx/XxxLayout.tsx
  -> 複数 View で共有する配置部品が必要な場合だけ追加
```

## レイヤー責務

### `app/.../page.tsx`

責務:

- `PageProps` を受け取る。
- `params` / `searchParams` を受け取る。
- `nuqs` などで URL クエリパラメータを解決する。
- ルーティング上の薄い adapter として `XxxPage` を呼び出す。

テスト方針:

- 原則としてテストしない。
- クエリパラメータの解決や正規化が複雑になった場合は、`parseXxxSearchParams()` のような純粋関数に切り出して、その関数を単体テストする。

### `features/xxx/XxxPage.tsx`

責務:

- RSC の本体として動く。
- データの GET を行う。
- 認可、未認証リダイレクト、`notFound()` などのルーティング分岐を扱う。
- Suspense 境界を配置する。
- `XxxView` や必要に応じた `XxxContainer` にデータを渡す。

テスト方針:

- 重要な分岐がある場合にテストする。
- Server Function やデータ取得関数をモックし、取得結果に応じて期待する状態が表示されるかを確認する。
- `notFound()`、未認証リダイレクト、空状態、エラー状態など、ユーザーに影響する分岐を確認する。
- 「どの子コンポーネントにどの props を渡したか」だけを細かく見るテストは避ける。実装詳細に寄りすぎるため。

### `features/xxx/XxxContainer.tsx`

責務:

- 必要な場合だけ作る。
- Client Component として、client state、フォーム、フィルタ、モーダル、optimistic UI、mutation などを扱う。
- UI の構造はできるだけ `XxxView` に寄せる。
- GET は原則として `XxxPage` 側で行い、Container は client interaction と mutation を中心にする。

テスト方針:

- Presentational の結合とユーザー操作をテストする。
- mutation の Server Action や外部依存をモックし、操作結果を確認する。
- GET 用の Server Function を Client Container から呼ぶ設計は避ける。必要な client-side read は Route Handler、SWR、React Query などを検討する。

### `features/xxx/XxxView.tsx`

責務:

- Presentational UI を担当する。
- Storybook の主対象にする。
- ロジックや外部依存は基本的に持たない。
- UI 固有の小さな状態は持ってよい。例: 開閉、選択中タブ、ローカルな表示切り替え。

テスト方針:

- Storybook で主要状態を args として表現する。
- 見た目、空状態、エラー表示、主要なインタラクションを確認する。
- 複雑なビジネスロジックは持ち込まない。

### `features/xxx/XxxLayout.tsx`

責務:

- 必要な場合だけ作る。
- 複数の View で共有される配置、または配置自体に意味がある場合に使う。
- 1 画面専用で単に Header / Body / Sidebar を並べるだけなら `XxxView` に吸収する。

テスト方針:

- 原則として単体テストしない。
- `XxxContainer` または `XxxView` の Default Story でカバーする。

## 層を増やす判断基準

### `XxxContainer.tsx` を作る場合

- client state がある。
- form や modal などの操作状態がある。
- mutation や optimistic UI がある。
- 複数の presentational component を、状態や操作ロジックで結合する必要がある。

作らない場合:

- `XxxPage` から取得したデータをそのまま表示するだけ。
- props を詰め替えるだけ。
- `XxxView` を 1 つ呼ぶだけ。

### `XxxLayout.tsx` を作る場合

- 複数画面で同じ配置を共有する。
- layout 自体が意味を持つ。
- Storybook 上で配置単位を独立して確認したい。

作らない場合:

- その画面でしか使わない。
- 単純な JSX の並び替えだけ。
- `XxxView` に入れても読みやすさが落ちない。

## データ取得と mutation のルール

- GET は原則として RSC の `XxxPage.tsx` で行う。
- Server Component から Client Component に渡す props は serializable にする。
- client-side read が必要な場合は Route Handler、SWR、React Query などを検討する。
- mutation は Server Action を基本にする。
- DB アクセス、認可、secret を扱う処理は client bundle に入れない。

## Storybook 方針

- Storybook の主対象は `XxxView.tsx`。
- RSC のデータ取得や認可を Storybook に持ち込まない。
- `XxxView` は args で状態を表現できるようにする。
- 複数 component の組み合わせが重要な場合は `XxxContainer` の Story を用意する。
- `XxxLayout` は単体 Story より、`XxxView` または `XxxContainer` の Default Story で確認する。

## 推奨ファイル構成

```txt
app/xxx/page.tsx

features/xxx/
  XxxPage.tsx
  XxxView.tsx
  XxxView.stories.tsx
  XxxPage.test.tsx
  XxxView.test.tsx

  XxxContainer.tsx        # 必要な場合だけ
  XxxContainer.stories.tsx
  XxxContainer.test.tsx

  XxxLayout.tsx           # 必要な場合だけ
```

## 最終ルール

最初は `page.tsx -> XxxPage.tsx -> XxxView.tsx` の 3 層で始める。

`XxxContainer.tsx` は client state / interaction / mutation が必要になったら追加する。

`XxxLayout.tsx` は共有価値がある場合だけ追加する。

層を追加するときは、テストが「層の存在確認」になっていないか確認する。ユーザーに影響する分岐、表示、操作を優先してテストする。

## 2026 年時点のレビュー指摘

全体方針は妥当。`page.tsx -> XxxPage.tsx -> XxxView.tsx` から始め、必要な場合だけ `XxxContainer.tsx` / `XxxLayout.tsx` を足す設計は、Next.js App Router / RSC 前提でも有効。

ただし、次の点は補強した方がよい。

- async Server Component の本体を細かく単体テストする方針に寄せすぎない。Next.js 公式は async Server Components について、現時点でも Unit Testing より E2E Testing を推奨している。`XxxPage.test.tsx` は、純粋関数化できる分岐やデータ整形の単体テストを中心にし、RSC 本体の重要なユーザー分岐は Playwright などの E2E / 統合テストで確認する。
- `GET は原則として RSC の XxxPage.tsx で行う` は、Client Container に GET を寄せないという意味では正しい。ただし、すべての read を `XxxPage.tsx` に集中させる必要はない。Server Component 側に置くことを原則にしつつ、`Suspense` 境界や表示単位に合わせて子 Server Component に colocate してよい。
- `params` / `searchParams` は Next.js 15+ 以降の Promise 前提で扱う。`PageProps<'/route'>` を使い、`await props.params` / `await props.searchParams` で解決する設計に寄せる。
- mutation は Server Action / Server Function を基本にしてよいが、Server Function は UI 経由以外からも直接 POST 可能。各 Server Function の内部で認証・認可を必ず検証する。
- 推奨ファイル構成の `XxxPage.test.tsx` / `XxxView.test.tsx` / `XxxContainer.test.tsx` は常設必須に見せない方がよい。Storybook story、Storybook/Vitest の story tests、E2E でカバーできる場合は、重複する単体テストを増やさない。
