アクションの結果を画面に表示したい:useActionState

pendingだけ欲しい:useTransition

アクションの結果を使わない：useTransition

router.pushによるisPendingを取得したい：useTransition

server actionをフォームの外からコールしたい：useTransition
→公式を見ると「useActionState は、フォームアクションの結果に基づいて state を更新するためのフックです。」とあるようにformとの融合をしつつactionの状態（ミューテーションの戻り値やisPending）を管理するために使う。

重い状態更新：useTransition（そもそもアクションと関係ない。状態更新で使うからuseActionStateは使わない）


===

## react hook formとuseActionStateは併用しなくて良い
- [Using react-hook-form with React 19, useActionState, and Next.js 15 App Router](https://markus.oberlehner.net/blog/using-react-hook-form-with-react-19-use-action-state-and-next-js-15-app-router)

- [Simplifying React Hook Form and Next.js 15 Server Actions Integration](https://ryanknight.io/posts/using-useactionstate-with-react-hook-form)


useActionStateはフォームに統合する必要がありますsubmitを起点に発火する。

またプログレッシブエンハンスメントを意識した実装をするなら有効。

ただしPEは基本的にユースケース全体をカバーしないと意味はないし、rhfはsubmitの動きを止めて、jsでバリデーションをする仕組みであるため、submitをつかうuseActionStateと相性が悪い。

submitで呼ばれた関数の中で処理をするため、アクションは引数にformDataを受け取るが、submitで呼ばれる関数の中で処理をするrhfはformDataを持たない。rhfが提供するフォームのsubmit値を扱う。

またアクションの実行の仕組みとして、特殊な実行コンテキストが必要だがrhfでactionを呼ぶとそのコンテキストに入らない

したがってrhfとuseActionStateを統合するためにはformDataをつくり、かつ特殊実行コンテキストに入れるためにstartTransitionでアクションをラップする必要がある。

上記自体は割と簡単にできるわけだけど、ちょっと面倒でハックかつあまりメリットがない。

なのでuse TransitionによるisPending取得ぐらいの組み合わせで良さそう。

またuseTransitionと組み合わせるとrhfのformStateだけじゃ得られない利点があり使うべきとまで言える。

またrhfがいらないともならない。なぜならuseActionStateはサブミット時に実行されるがrhfはサブミットよりも前にバリデーションが走る。正確にはサブミット時には知っているがバリデーションがサブミットのメイン処理より前に実行され、ユーザに即フィードバックされる。これはuseActionStateだけで実現はできない。

1. router.push などのナビゲーションが transition になる
これが最大の理由だと思います。submit 後に router.push や router.refresh する場合、それを startTransition の中で呼ぶと、遷移先のページがレンダリング完了するまで isPending が true のままになります。
formState.isSubmitting だけだと「Server Action の await が終わった瞬間に false」になるので、その後のページ遷移中はボタンが有効に戻ってしまい、ユーザーが二度押しできてしまいます。useTransition を使えばここまでカバーできます。
2. Suspense と協調する
transition 内で発生した状態更新は、Suspense 境界で「フォールバックを出さずに古い UI を見せたまま待つ」挙動になります。submit 後にデータ再取得→Suspense で待つ、みたいな構成で UI のチラつきを防げます。
3. UI をブロックしない
transition 中も他のインタラクションは普通に動きます。重い更新でも他のボタンが反応しなくなったりしない。

使い分けの感覚:
•	submit して終わり（成功時にトーストだけ出す等）: useTransition は不要、formState.isSubmitting で十分
•	submit 後にページ遷移や再フェッチがある: useTransition を使うと「遷移完了まで pending」が表現できて UX が良い
•	楽観的更新したい: useTransition + useOptimistic の組み合わせが効く