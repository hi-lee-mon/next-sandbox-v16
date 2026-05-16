# BetterAuth 導入ガイド

> このドキュメントは、BetterAuth をこのプロジェクトへ導入した際の作業内容を、新しいメンバーが理解できるようにまとめたものです。

---

## 1. BetterAuth とは？

**BetterAuth** は TypeScript ファーストの認証ライブラリです。

従来のプロジェクトでは「ログインしたらメールアドレスをクッキーに保存するだけ」という簡易実装でした。
これでは**セキュリティ上の問題**があります（誰でもクッキーを書き換えてなりすましできてしまう）。

BetterAuth を使うと：

- パスワードの安全なハッシュ化
- セッション管理（DBにセッション情報を保存）
- サインイン・サインアップ・サインアウトのAPIを自動生成
- セッションの有効期限管理

…をすべて自動でやってくれます。

---

## 2. 変更前・変更後の構成比較

### 変更前（簡易実装）

```
ユーザーがログイン
  → メールアドレスをそのままクッキーに保存
  → クッキーの内容を読んでセッション判定
  ※ セキュリティなし
```

### 変更後（BetterAuth）

```
ユーザーがログイン
  → BetterAuth がパスワードを検証（DBと照合）
  → 暗号化されたセッショントークンをクッキーに保存
  → DB上のセッションテーブルと突合してセッション判定
  ※ 改ざん不可能
```

---

## 3. 追加・変更したファイル一覧

```
プロジェクト/
├── lib/
│   ├── auth.ts          ★ 新規作成：BetterAuth サーバー設定
│   └── auth-client.ts   ★ 新規作成：BetterAuth クライアント設定
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts   ★ 新規作成：認証APIルート
│   ├── _action/
│   │   └── sign-out.ts        ★ 新規作成：サインアウト処理
│   ├── _data/
│   │   └── verify-session.ts  ✏️ 更新：BetterAuth のセッション取得に変更
│   ├── login/
│   │   └── page.tsx           ✏️ 更新：BetterAuth でのサインイン
│   └── (default)/
│       └── layout.tsx         ✏️ 更新：セッション情報の取得先を変更
└── proxy.ts                   ✏️ 更新：BetterAuth でのセッション確認
```

---

## 4. 各ファイルの役割

### `lib/auth.ts` — サーバー側のBetterAuth設定

```ts
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  appName: "next-sandbox",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,  // セッション暗号化に使う秘密鍵
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,  // メール・パスワード認証を有効化
  },
});
```

**ポイント：** `secret` は絶対に公開してはいけません。`.env.local` で管理します。

---

### `lib/auth-client.ts` — クライアント側の設定

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});
```

ブラウザ（クライアントコンポーネント）から `authClient.signIn.email()` などを呼び出すための設定です。

---

### `app/api/auth/[...all]/route.ts` — 認証APIルート

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

`/api/auth/sign-in`、`/api/auth/sign-out` などのエンドポイントを BetterAuth が自動生成します。
`[...all]` というフォルダ名で「どんなパスでもこのルートが処理する」という意味です。

---

### `app/_data/verify-session.ts` — セッション確認

```ts
// 変更前
import { getToken } from "./get-token";
const token = await getToken();
return JSON.parse(token) as Session  // 誰でも偽造可能

// 変更後
import { auth } from "@/lib/auth";
const session = await auth.api.getSession({ headers: await headers() });
return session  // DBと照合して検証済み
```

サーバーコンポーネントやServer Actionから「現在ログイン中のユーザー情報」を取得するときに使います。

---

### `proxy.ts` — ミドルウェア（アクセス制御）

```ts
import { getSessionCookie } from 'better-auth/cookies'

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')

  if (!sessionCookie && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}
```

ユーザーの**すべてのリクエストに対して最初に実行**されます。

BetterAuth 公式が提供する `getSessionCookie(request)` ヘルパーを使ってクッキーの**存在確認のみ**行います。DBへのアクセスはしません。
これを「楽観的チェック」と呼びます。

> **「楽観的チェック」とは？**
>
> 「楽観的（optimistic）」とは、**「悪いことは起きないだろう」と仮定して処理を進めるアプローチ**のことです。
>
> クッキーの存在確認は「セッションが有効である**だろう**」という前提で通過させます。
> しかし実際には、クッキーが残っていても期限切れや強制ログアウト済みのセッションである可能性があります。
> DBを見ないかぎり「本当に有効か」は確認できないため、この確認を「楽観的」と呼びます。
>
> 対して `verifySession()` でDBと突合するのが**「悲観的チェック」**です。
>
> | | 楽観的チェック（`proxy.ts`） | 悲観的チェック（`verifySession()`） |
> |-|----|----|
> | DBアクセス | なし | あり |
> | 速度 | 高速 | 低速 |
> | 正確さ | 低い（クッキー偽造・期限切れを見逃す） | 高い（DBで確実に検証） |
> | 実行タイミング | 全リクエスト | ページ描画時のみ |
>
> ミドルウェアは全リクエストで実行されるため、DBクエリを毎回行うとパフォーマンスが低下します。
> そのため「明らかな未ログインユーザー（クッキーなし）」だけを弾く楽観的チェックをミドルウェアで行い、
> 本当の検証は描画時の `verifySession()` に委ねることで、セキュリティと性能を両立しています。

| 役割 | 場所 | DB |
|------|------|----|
| 楽観的チェック（クッキー存在確認） | `proxy.ts` | なし（高速） |
| 正確なセッション検証 | `verifySession()` | あり（改ざん検出可） |

**注意：** `matcher` の `source` に `api/auth` を除外しているのは、認証API自体をブロックしないためです。

---

### `lib/action/sign-in.ts` — サインイン Server Action

```ts
"use server"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export const signIn = async (body: LoginInput): Promise<{ error: string } | never> => {
  const result = await auth.api.signInEmail({
    body,
    headers: await headers(),
  })

  if (!result) return { error: "ログインに失敗しました" }

  redirect("/")
}
```

**なぜ Server Action にするのか？**

クライアント側（`authClient.signIn.email()`）でサインインすると、セッションCookieの確立とページ遷移が別タイミングになるため、Next.js の RSCキャッシュが古い「未ログイン状態」のまま残ってしまいます。その修正のために `router.refresh()` が必要でした。

Server Action にすると、サーバー側でセッション確立 → `redirect("/")` が一体化して実行されるため、ブラウザが受け取る時点でセッションはすでに確立済みです。キャッシュのズレが根本的に発生しません。

| | クライアント側 signIn | Server Action signIn |
|---|---|---|
| セッション確立の場所 | ブラウザ | サーバー |
| リダイレクト方法 | `router.push()` + `router.refresh()` | `redirect()`（1行） |
| RSCキャッシュのズレ | 発生しうる | 発生しない |

**`headers()` を渡す理由**

`auth.api.signInEmail` にヘッダーを渡すのは任意ですが、渡すことで以下の情報を better-auth が利用できるようになります：

- **IPアドレス・User-Agent**：レートリミットや監査ログ（誰がどこからログインしたか）に活用
- **既存のCookie**：リクエスト元の状態を正確に把握するため

better-auth はフレームワーク非依存の設計のため、リクエスト情報を自動取得しません。`headers()` で明示的に渡す必要があります。

> `getSession` ではヘッダーは**必須**です。セッショントークンが Cookie（= headers の一部）に含まれているため、渡さないと「誰のセッションか」が判断できません。

---

### `app/login/page.tsx` — ログインフォーム

```ts
// 変更前（クライアント側 signIn）
const { error } = await authClient.signIn.email({
  email: data.email,
  password: data.password,
})
router.push("/")
router.refresh()  // RSCキャッシュの手動リセットが必要だった

// 変更後（Server Action 呼び出し）
const result = await signIn(data)
if (result?.error) toast.error("ログインに失敗しました", { description: result.error })
// router.push も router.refresh も不要
```

Server Action が成功すると `redirect("/")` がサーバー側で発火するため、クライアントは何もする必要がありません。

---

### `app/_action/sign-out.ts` — サインアウト

```ts
"use server"

export async function signOut() {
  await auth.api.signOut({ headers: await headers() })
  redirect("/login")
}
```

ログアウトボタンが押されたときに実行されるServer Actionです。
BetterAuth がDBのセッションレコードを削除し、クッキーをクリアしてくれます。

---

## 5. データベースの変化

BetterAuth のマイグレーションコマンド（`pnpm exec better-auth migrate`）を実行すると、以下のテーブルが自動的に作成されます：

| テーブル名 | 役割 |
|-----------|------|
| `user` | ユーザー情報（メール、パスワードハッシュなど） |
| `session` | セッション情報（トークン、有効期限など） |
| `account` | 外部認証プロバイダー連携（Google等）用 |
| `verification` | メール認証用の一時トークン |

---

## 6. 環境変数

`.env.local` に以下を追加する必要があります：

```bash
BETTER_AUTH_SECRET=<32文字以上のランダム文字列>  # openssl rand -base64 32 で生成
BETTER_AUTH_URL=http://localhost:3000             # 本番では本番URLに変更
DATABASE_URL=postgres://user:password@localhost:5432/dbname
```

`BETTER_AUTH_SECRET` は**絶対にGitにコミットしないでください**。

---

## 7. 認証フローの全体像

```
[ブラウザ]
  |
  | 1. ログインフォームを送信
  ↓
[signIn() Server Action]  ← lib/action/sign-in.ts
  |
  | 2. サーバー側で auth.api.signInEmail() を呼ぶ
  |    （headers() でIPアドレス・User-Agentを渡す）
  ↓
[BetterAuth] DBでパスワード検証
  ↓
[PostgreSQL] user テーブルを照合
  |
  | 3. 検証OK → session テーブルにレコード挿入
  | 4. 暗号化セッショントークンをクッキーにセット
  | 5. redirect("/") をサーバー側で発火
  ↓
[ブラウザ] セッション確立済みの状態でリダイレクト先を受け取る
  |        ※ この時点でキャッシュのズレは発生しない
  |
  | 6. 次のリクエスト時
  ↓
[proxy.ts] セッションクッキーの存在確認のみ（DBなし・高速）
  |
  | 7. クッキーなし → /login へリダイレクト
  | 7'. クッキーあり → 通過
  ↓
[verifySession() in layout.tsx] DBでセッションを正確に検証
  |
  | 8. 有効 → そのまま表示
  | 8'. 無効（期限切れ等） → /login へリダイレクト
```

---

## 8. 今後の拡張について

BetterAuth はプラグイン形式で機能を追加できます：

- **Google / GitHub ログイン** → `socialProviders` を設定するだけ
- **二段階認証** → `twoFactor()` プラグインを追加
- **パスキー認証** → `passkey()` プラグインを追加

---

> **まとめ：** BetterAuth を導入することで、セキュアな認証機能を最小限のコードで実現できます。セッションはDBで管理されるため、改ざんや不正ログインを防ぐことができます。
