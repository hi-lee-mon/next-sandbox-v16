https://ja.react.dev/reference/react/useTransition

useTransition は、UI を部分的にバックグラウンドでレンダーするための React フックです。

以下戻り値
- トランジションが保留中であるかどうかを示す isPending フラグ。
- 更新をトランジションとしてマークするための startTransition 関数

## アクションとは？
startTransition に渡される関数は「アクション」と呼ばれます

## startTransition
アクションを受け取り、action関数の中で行われるstate更新をトランジションとしてマークする機能
アクション内で実行中に発生するすべての state 更新がトランジションとしてマークされます

## isPendingはいつまで続くのか？
すべてのアクションが完了して最終的な状態がユーザに表示されるまで true のままになります。
Suspense 境界の中身（実データ）は後からストリーミングされます。startTransitionはそのストリーミング完了＋DOM コミットまで含めて「終わり」とみなします。

なので正確には：
SCの再実行完了 ＝ RSCストリーミング完了 ＝ 全Suspenseが解決 ＝ トランジション完了 ＝ isPending = false

## startTransitionの使用上の注意点
action 内で await されている非同期関数のコールもトランジションの一部ではありますが、現時点では await の後に来る set 関数は別の startTransition にラップする必要があります

## ある props やカスタムフックの値に反応してトランジションを開始したい場合
代わりに useDeferredValue を試してみてください。

## トランジションと普通の状態更新のレース
トランジションとしてマークされた state 更新は、他の state 更新によって中断されます。

例えば、トランジション内でチャートコンポーネントを更新した後、チャートの再レンダーの途中で入力フィールドに入力を始めた場合、React は入力欄の更新の処理後にチャートコンポーネントのレンダー作業を再開します。

## startTransitionの動作
アクション内では副作用や状態更新が行なえます。
この作用はバックグラウンドで実行され、ページ上のユーザ操作をブロックすることがないです。

## useOptimisticとの違い
トランジションの進行中でも状態を更新できる？

## useTransitionが割り込めないもの
動作確認とかで
```ts
  const start = performance.now();
  while (performance.now() - start < 3000) {
    // 3秒間ブロックする
  }
```
を使ってもだめ。

jsスレッドが占有されてReactは停止してしまう。

useTransitionを動かすためにはスレッド上でReactが動けるかつ、Reactの所有物であるFiberや状態管理が使える状態じゃないとだめ？

あとsetTimeout内でstateを更新してもマークされない

例外として以下のように細かいブロックを入れて、たくさんレンダリングしたら行ける。
```ts
  let startTime = performance.now();
  while (performance.now() - startTime < 1) {
    // 1ms ブロックする重い処理のシミュレーション
  }
```