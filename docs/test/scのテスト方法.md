## e2e
SCはe2eで実施することが推奨されている。次の公式ページを参照

https://nextjsjp.org/docs/app/guides/testing#%E9%9D%9E%E5%90%8C%E6%9C%9F%E3%82%B5%E3%83%BC%E3%83%90%E3%83%BC%E3%82%B3%E3%83%B3%E3%83%9D%E3%83%BC%E3%83%8D%E3%83%B3%E3%83%88

@tests/e2e/blog-list.spec.ts で実装してみている。リアル環境なのでカバー範囲が多く有効。しかし、seedの用意やネットワークが絡むのでflakyなテストになったり時間がかかったりとたくさんのテストを行うには向かない

## storybook

次にstorybookによるRSC対応。基本的にはモックすることになる。sbの公式ブログ参照：https://storybook.js.org/blog/storybook-react-server-components/
storybookでRSCを使うにはmain.tsで
```ts
    experimentalRSC: true,
```
を有効にしてかつ
```ts
const meta = preview.meta({
  component: BlogList,
  parameters: {
    react: {
      rsc: true,
    },
  },
});
```
のようにしてrscを使えるようにする設定を書く必要がある

更に今度はDALを作ることでモックしやすい設計とすることが推奨される

また、10.4ではpreview.tsでsb.mockを読み込む必要がある。これがやっかいでファイルを分けてmockを詰め込むことができないっぽい。
preview.tsxではmoduleのモックを登録して、何を返すかをstoriesで登録する必要があるみたい。
つまり大量のモックをpreview.tsxにかく必要がありそう。

どうやら、preview.tsxではなくstories内でsb.mockすると先に本物が読まれちゃう。

これを自動mockと呼ぶのだけど、他の方法よりも簡単でおそらくstorybookで推奨されるmock方法っぽい

でもrepo見るとmswを使っている。こっちもみてみて後述する

## そもそもmockのデメリット
内部実装を見ることになり、getPublicBlogsから別の関数に置き換えるとすぐに壊れる
またブログ取得処理が依存するauthやrevalidateなどのnext系のapiのモックが必要になってきてしまう。単純にblog取得をモックするだけではだめ。ただ表示を確認したいだけの場合は対応が重いと感じられる。

## __mock__
このフォルダの中に同名の関数を置くことでモックの再利用ができる

node_modulesの場合はrootに配置する