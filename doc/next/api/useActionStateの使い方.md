## いつ使うか？
ステート更新に非同期処理が必要だったり、更新系の処理に紐づいたステートがある場合には、useActionStateを使うと良い

(非同期トランジションのためにuseTransitionってあんまり使うことないかも)

## エラーハンドリング
action内でメッセージやエラーフラグをreturnする。throwはしない。
return結果をハンドリングする

## 詳細
第一引数はアクション、第二引数は初期状態

戻り値は状態、フォームで使用するアクション、isPendingになる。
```tsx
  const [state, runAction, isPending] = React.useActionState(createUser, null)
```

アクションのルール
- アクションは非同期関数
- 引数は第一引数が現在の状態で、第二引数はrunActionの引数になる。
- 戻り値は状態となる
- 呼び出しは直列で実行される（例えば連打しても順番に実行される。これはuseActionStateが状態を扱っており、状態の矛盾を回避するための施策だと考えられる。https://zenn.dev/uhyo/books/react-19-new/viewer/useactionstate#useactionstate%E3%81%AEapi）

runActionの呼び出しにもルールがあります。startTransitionの中で呼び出す必要があります。
整理すると以下のような構成になる」
```ts
export async function createUser(currentState: CreateUserOutput | null, formData: CreateUserInput): Promise<CreateUserOutput>

const [state, runAction, isPending] = React.useActionState(createUser, null)

  const handleSubmit = async (data: CreateUserInput) => {
    React.startTransition(async () => await runAction(data))
  }
```
