use cacheを使うことでページ、関数を15mキャッシュすることができる。
キャッシュ時間の変更はcacheLifeで行う

```tsx
"use cache"
cacheLife("max") // 30日
```

データの再検証はタグを設定する
```tsx
"use cache"
cacheLife("max") // 30日
cacheTag("cache-key")
```

更新方法は2つある
revalidateTagはSWRによる更新（SFとroute.tsで機能）
updateTagは即時更新（SFのみ機能）

```tsx
updateTag("cache-key")
```

基本的にrevalidatePathを使うところは限られる。updateTagを使うのが良さそう。

## 注意点
- cacheコンポーネントはルートセグメント設定は使えない。
- edge runtimeは使えない。（node runtime限定）
