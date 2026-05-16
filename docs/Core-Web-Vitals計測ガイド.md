# Core Web Vitals 計測ガイド

## このドキュメントについて

実際のユーザー環境（RUM: Real User Monitoring）でページパフォーマンスを計測するために導入した仕組みの解説です。新しく参加したメンバーがコードを読んだときに「なぜこう書いているのか」を理解できることを目的としています。

---

## Core Web Vitals とは？

Google が定義した「ユーザー体験の質」を測る指標群です。SEO スコアに直接影響します。

### Core Web Vitals（3指標）

| 指標 | 正式名称 | 意味 | 良い基準 |
|------|----------|------|----------|
| **LCP** | Largest Contentful Paint | 最大のコンテンツ要素が表示されるまでの時間 | ≤ 2.5s |
| **INP** | Interaction to Next Paint | ユーザー操作から次の描画までの時間 | ≤ 200ms |
| **CLS** | Cumulative Layout Shift | ページ読み込み中のレイアウトのずれ量 | ≤ 0.1 |

> INP は 2024年3月に FID（First Input Delay）を置き換えた指標です。FID は最初の操作のみを評価していましたが、INP はページ全体を通じたインタラクション応答性を評価します。

### 診断指標（Core Web Vitals ではないが計測可能）

| 指標 | 正式名称 | 意味 |
|------|----------|------|
| **TTFB** | Time to First Byte | サーバーが最初の1バイトを返すまでの時間 |
| **FCP** | First Contentful Paint | 最初のコンテンツが画面に表示されるまでの時間 |

これらは LCP や INP の問題原因を調査するための補助情報として活用します。

---

## インストールしたパッケージ

```
web-vitals（v5）
```

Google Chrome チームが開発・メンテナンスしている公式の計測ライブラリです。ブラウザの Performance API をラップし、各指標を正確なタイミングで取得します。

**なぜ Next.js 組み込みのものを使わないのか？**

Next.js は内部で `web-vitals` を同梱しており、`next/web-vitals` から `useReportWebVitals` というフックとして提供しています。ただし、これは React フック（`useEffect` のラッパー）なので、クライアントコンポーネントとして実装する必要があります。

`web-vitals` を直接インストールすると、React に依存しない形で使えるようになり、より早いタイミング・よりシンプルな構造で計測を開始できます。また、`web-vitals/attribution` という専用のエントリポイントから attribution 付きの関数を型安全にインポートできます。

---

## 移行の経緯

### 最初の実装（`useReportWebVitals`）

当初は Next.js が提供する `useReportWebVitals` を使い、クライアントコンポーネントとして実装していました。

```
app/
├── layout.tsx                   ← <WebVitals /> を配置
└── _components/
    └── web-vitals.tsx           ← 'use client' + useReportWebVitals
```

この方法の問題点：

- React のハイドレーション**後**にしか計測が始まらない
- `'use client'` ディレクティブが必要でクライアント境界を作ってしまう
- `useReportWebVitals` の実体は `useEffect` で `onLCP` / `onCLS` / `onINP` を呼ぶだけ

### 現在の実装（`instrumentation-client.ts`）

Next.js 15.3 で導入された `instrumentation-client.ts` に移行しました。React に依存しないため、ハイドレーション前から計測を開始できます。

```
instrumentation-client.ts   ← プロジェクトルートに配置（Next.js が自動で読み込む）
```

`app/_components/web-vitals.tsx` と `app/layout.tsx` への `<WebVitals />` 配置は不要になり、削除しました。

---

## `instrumentation-client.ts` とは？

Next.js 15.3 で導入されたファイル規約です。**プロジェクトルートに置くだけで Next.js が自動的に読み込みます**（設定不要）。

### 実行タイミング

```
HTML ダウンロード完了
    ↓
instrumentation-client.ts を実行  ← ここ（React より前）
    ↓
React ハイドレーション開始
    ↓
ユーザーが操作可能になる
```

ハイドレーション前に実行されるため、FCP や LCP といった初期描画に関わる指標を取りこぼしなく計測できます。

### サーバーサイドでは実行されない

名前に "client" とある通り、このファイルはブラウザ上でのみ実行されます。`window` や `navigator` を直接使えます。

---

## 現在の実装コード

```ts
// instrumentation-client.ts
import { onCLS, onINP, onLCP } from 'web-vitals/attribution'  // Core Web Vitals（attribution付き）
import { onFCP, onTTFB } from 'web-vitals'                    // 診断指標（attributionなし）
```

`web-vitals/attribution` からインポートすると、コールバックの引数に `attribution` フィールドが追加されます。これにより「どの DOM 要素が原因で LCP が遅いか」「どのインタラクションが INP の原因か」といった情報が得られます。

### attribution の内容（指標ごと）

**LCP**
```ts
attribution: {
  target: string          // LCP 要素の CSS セレクタ（例: "img.hero"）
  url?: string            // 画像の場合、そのリソース URL
  timeToFirstByte: number // TTFB（ms）
  resourceLoadDelay: number
  resourceLoadDuration: number
  elementRenderDelay: number
}
```

**CLS**
```ts
attribution: {
  largestShiftTarget?: string   // ズレた要素の CSS セレクタ
  largestShiftValue?: number    // そのシフトのスコア
  largestShiftTime?: number     // シフトが起きた時刻（ms）
  loadState?: string            // 発生時のドキュメント状態
}
```

**INP**
```ts
attribution: {
  interactionTarget: string     // 操作された要素の CSS セレクタ
  interactionType: 'pointer' | 'keyboard'
  inputDelay: number            // イベント処理開始までの遅延（ms）
  processingDuration: number    // イベントハンドラの処理時間（ms）
  presentationDelay: number     // 処理完了から描画までの時間（ms）
  loadState: string
}
```

---

## 開発者が確認する場所

### 開発環境（ブラウザのコンソール）

ページを開くと DevTools のコンソールに以下のように出力されます。

```
[WebVitals] LCP: 1234.5 (good)     ← 緑色
[WebVitals] CLS: 0.05 (good)       ← 緑色
[WebVitals] INP: 320.0 (poor)      ← 赤色
```

グループを展開すると `console.table` で attribution の詳細が確認できます。

**INP が poor のとき：** `interactionTarget` を確認し、どのボタンやリンクが遅いかを特定してください。`inputDelay` が大きければメインスレッドの過負荷、`processingDuration` が大きければイベントハンドラの処理が重いことを示します。

**LCP が needs-improvement 以上のとき：** `url` フィールドで遅い画像リソースを特定し、`resourceLoadDuration` と `elementRenderDelay` のどちらが大きいかを確認してください。

### 本番環境（未実装・今後の対応）

現在、本番では `/api/web-vitals` に `sendBeacon` でデータを送信しようとしますが、このエンドポイントはまだ実装されていません。実装が必要になった時点で `app/api/web-vitals/route.ts` を作成してください。

---

## まとめ

| 項目 | 内容 |
|------|------|
| 計測ファイル | `instrumentation-client.ts`（プロジェクトルート） |
| 使用パッケージ | `web-vitals`（v5） |
| 対象指標（Core） | LCP / INP / CLS（attribution 付き） |
| 対象指標（診断） | FCP / TTFB |
| 開発時の確認方法 | ブラウザ DevTools コンソール |
| 本番時の送信先 | `/api/web-vitals`（未実装） |
