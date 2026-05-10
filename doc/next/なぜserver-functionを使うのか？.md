# ログイン処理をServer Functionに移行した理由と仕組み

## 要約

route.tsはボイラープレートが多く、型安全じゃない。例えばfetchのパスを間違えてもエラーにならない。

sfのほうがコードが簡潔になる。redirectを使うことでワークアラウンドが減る。

route.ts
cc→route→CC→キャッシュパージ→リダイレクトリクエスト→SC実行→画面表示（一度CCへレスポンスして何らかの操作をしてリダイレクトする）

sf
cc→sf→キャッシュパージ→リダイレクト→画面表示（リクエストして戻ってくるときに全て更新された状態になる。一往復）

### 移行前の問題点

クライアント側でログインすると、「セッションCookieの確立」と「ページ遷移」がブラウザ上で別々に起きます。
そのため Next.js の Router Cache（ブラウザ側キャッシュ）が古い「未ログイン状態」のまま残り、
`router.refresh()` でキャッシュを手動でリセットする**後処理が必須**でした。

これは根本的な解決ではなく「キャッシュとセッションのズレを事後修正する」パッチ対応です。

### Server Function で何が変わるか

| 観点 | クライアント側 signIn | Server Function signIn |
|---|---|---|
| **キャッシュのズレ** | 発生する（`router.refresh()` で事後修正） | 発生しない（構造的に解消） |
| **セキュリティ** | 認証ロジックがブラウザのJSとして動く | サーバー上のみで動く（ブラウザから見えない） |
| **パフォーマンス** | push → refresh と2往復が発生 | サーバー側で `redirect()` を1回発火するだけ |
| **コードの可読性** | `useRouter`・`router.push`・`router.refresh` が必要 | `signIn(data)` を呼ぶだけ。遷移処理はサーバー側に隠蔽 |

Server Function では「セッション確立」と「リダイレクト」がサーバー上で一体化しているため、
ブラウザがレスポンスを受け取った時点でセッションはすでに確立済みです。
キャッシュのズレが構造的に発生しないため、`router.push()` も `router.refresh()` も不要になります。

---

## はじめに

ログイン処理を「クライアント側で実行する方法」から「Server Function（サーバー側で実行する方法）」に変更しました。
この変更によって、コードがシンプルになり、セキュリティも向上しています。
なぜそのような変化が起きたのかを、順を追って解説します。

---

## 変更前：クライアント側でログイン処理をしていたコード

```tsx
// app/login/page.tsx（変更前）
"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

const router = useRouter()

async function onSubmit(data: LoginInput) {
  const { error } = await authClient.signIn.email({
    email: data.email,
    password: data.password,
  })

  if (error) {
    toast.error("ログインに失敗しました", { description: error.message })
    return
  }

  router.push("/")    // ← ページ遷移
  router.refresh()   // ← RSCキャッシュを手動でリセット（←これが問題の根源）
}
```

### なぜ `router.refresh()` が必要だったのか？

Next.js には **RSC（React Server Components）キャッシュ** という仕組みがあります。
サーバー側でレンダリングしたコンポーネントの結果を一時的に保存しておき、
同じページへ遷移するときに再利用することで表示を高速化します。

```
[ログイン前のキャッシュ]
  → "未ログイン状態" で描画されたページが保存されている

[クライアント側でログイン]
  → ブラウザのセッションCookieは更新された
  → でもサーバーのRSCキャッシュはまだ "未ログイン状態" のまま！

[router.push("/") だけすると]
  → キャッシュされた "未ログイン状態" のページが表示される　← バグ！

[router.refresh() を呼ぶ]
  → キャッシュを無効化して、サーバーに再レンダリングを要求する
  → 正しくログイン済み状態のページが表示される　← 正常
```

つまり `router.refresh()` は「キャッシュとセッション状態のズレ」を修正するための **後処理** でした。

---

## 変更後：Server Functionでログイン処理をするコード

```ts
// lib/action/sign-in.ts（変更後）
"use server"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export const signIn = async (body: LoginInput): Promise<{ error: string } | never> => {
  const result = await auth.api.signInEmail({
    body,
    headers: await headers(), // リクエストのヘッダー情報をサーバーに渡す
  })

  if (!result) {
    return { error: "ログインに失敗しました" }
  }

  redirect("/") // サーバー側でリダイレクトを発行
}
```

```tsx
// app/login/page.tsx（変更後）
import { signIn } from "@/lib/action/sign-in"

function onSubmit(data: LoginInput) {
  startTransition(async () => {
    const result = await signIn(data)  // Server Functionを呼ぶだけ
    if (result?.error) {
      toast.error("ログインに失敗しました", { description: result.error })
    }
    // router.push も router.refresh も不要！
  })
}
```

---

## なぜ `router.refresh()` が不要になったのか？

処理の流れがまったく変わったからです。

### 変更前の流れ（クライアント側）

```
1. ブラウザ → better-auth API を直接呼ぶ（クライアント側）
2. セッションCookieがブラウザに保存される
3. router.push("/") → 遷移（キャッシュが残っている）
4. router.refresh() → キャッシュ破棄 → サーバーに再レンダリング要求
5. サーバーがセッションを認識してログイン済みページを返す
```

問題点：ステップ3と4の間に「キャッシュとセッションがずれている瞬間」が存在する。

### 変更後の流れ（Server Function）

```
1. ブラウザ → Server Function（サーバー上の関数）を呼ぶ
2. サーバー側でセッションCookieをセット済みの状態で redirect("/") を実行
3. ブラウザは「セッションがすでに確立された後のリダイレクト先」を受け取る
4. ページをフレッシュな状態でレンダリング（キャッシュのズレは発生しない）
```

「セッションを作る」と「リダイレクトする」がサーバー上で **一体化** しているため、
キャッシュとセッション状態がずれる瞬間が存在しません。

---

## まとめ：変更によって得られたメリット

| 観点 | 変更前 | 変更後 |
|---|---|---|
| セッション確立の場所 | ブラウザ（クライアント） | サーバー |
| リダイレクト方法 | `router.push()` + `router.refresh()` | `redirect()`（1行） |
| キャッシュのズレ | 発生しうる | 発生しない |
| クライアントコードの複雑さ | `useRouter` が必要 | 不要 |
| セキュリティ | 認証ロジックがブラウザで動く | 認証ロジックがサーバーで動く |

### セキュリティ面について

変更前は `authClient`（クライアント用のSDK）を使っていたため、
認証に関するロジックがブラウザのJavaScriptとして実行されていました。
変更後は `auth.api`（サーバー用のSDK）を使い、サーバー上でのみ実行されるため、
認証処理がブラウザから見えなくなります。

---

## `headers()` を渡している理由

```ts
const result = await auth.api.signInEmail({
  body,
  headers: await headers(), // ← これ
})
```

サーバー上で認証処理をするとき、better-auth はリクエスト元の情報（IPアドレスやUser-Agentなど）を
セキュリティチェックや監査ログに使います。
`headers()` は現在のHTTPリクエストのヘッダーをそのまま渡す関数で、
これを渡さないとサーバー側でリクエスト情報が欠落します。

---

## 図解：全体のイメージ

```
【変更前】
ブラウザ ──(メールアドレス+パスワード)──→ better-auth API（クライアント用）
                                              ↓
                                         セッションCookie発行
                                              ↓
ブラウザ ←──(Cookie)─────────────────────────
  ↓
router.push("/") ─→ キャッシュされた古いページ（まだ未ログイン状態）
  ↓
router.refresh() ─→ サーバーに再レンダリング要求
  ↓
サーバー ─→ ログイン済みページ返却

【変更後】
ブラウザ ──(メールアドレス+パスワード)──→ Server Function（サーバー上の関数）
                                              ↓
                                    サーバー側でセッションCookie発行
                                              ↓
                                    redirect("/") をサーバー側で実行
                                              ↓
ブラウザ ←──(セッション済みリダイレクト)────────
  ↓
最初からログイン済み状態のページが表示される
```
