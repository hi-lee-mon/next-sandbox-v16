# next-sandbox-v16

Next.js 16 の新機能・API を試す学習用サンドボックス。

Cache Componentを使用する。

React Compilerは使用しない。理由は会社が使っておらず挙動差異をなくしたいため。ただし、実装ルールとしてReact Compiler Markerを使い常にReact Compilerの導入ができる状況にすること

## 技術スタック

| カテゴリ | ライブラリ |
|---|---|
| フレームワーク | Next.js 16.2 / React 19 |
| スタイリング | Tailwind CSS v4 |
| UIコンポーネント | shadcn/ui |
| 認証 | better-auth |
| DB | PostgreSQL 18 (Docker) |
| フォーム | react-hook-form + Zod |
| Lint | ESLint / markuplint |

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集して必要な値を設定する。

### 3. データベースの起動

```bash
docker compose up -d
```

| サービス | URL |
|---|---|
| PostgreSQL | `localhost:5432` |
| pgAdmin | http://localhost:5050 |

### 4. 開発サーバーの起動

```bash
pnpm dev
```

http://localhost:3000 で起動する。

## スクリプト

```bash
pnpm dev       # 開発サーバー起動
pnpm build     # プロダクションビルド
pnpm start     # プロダクションサーバー起動
pnpm lint      # ESLint 実行
pnpm muplint   # markuplint 実行
```

## ディレクトリ構成

```
app/
├── (default)/          # 認証が必要なページ群
│   ├── about/
│   ├── profile/
│   └── test/
├── login/              # ログインページ
├── signup/             # サインアップページ
└── api/auth/           # better-auth のAPIルート
lib/
├── auth.ts             # better-auth サーバー設定
├── auth-client.ts      # better-auth クライアント設定
├── db.ts               # PostgreSQL 接続
├── action/             # Server Actions
└── verify-session.ts   # セッション検証
components/ui/          # shadcn/ui コンポーネント
doc/                    # 学習メモ・設計ドキュメント
```

## ドキュメント

`doc/` 配下に実装時のメモや設計方針をまとめている。

- `doc/next/` — Next.js のAPI・設計パターン
- `doc/db/` — PostgreSQL / Docker 環境構築
- `doc/form/` — フォーム設計
- `doc/shadcnui/` — shadcn/ui の使い方
