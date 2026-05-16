フルルートキャッシュの場合使える機能で時間ベースのrevalidateを行うために使う

これで15秒毎にrebuildされるようになる
```tsx
export const dynamic = 'force-static';
export const revalidate = 15
```

例えば/blogsを静的ページと過程する。
/blogs/createでpostしてSFでredirectする。
redirectはソフトナビゲーションなのでRSCペイロードのRouterキャッシュを使って画面が表示される。（/blogs静的ページなので5mほどキャッシュされる）
その状態でreloadすると/blogsのhtmlが200でレスポンスされる。
```
cache-control s-maxage=15, stale-while-revalidate=31535985
x-nextjs-cache HIT
etag "6vewt658van9t"
x-nextjs-stale-time 300
```
とあるようにキャッシュにヒットしている。そしてキャッシュは15秒であることがわかる
（x-nextjs-stale-timeはRouterキャッシュ）
（stale-while-revalidate=31535985は1年経ったらCDNのキャッシュの使用を禁止する。つまりリクエストが来たことを契機に最新の情報で再生成されるようになる）

さらにリロードすると304でレスポンスされ、ブラウザのキャッシュが返る
304はETagを使って判断している。
nextはレスポンスのときにetagをレスポンスヘッダーにつけて200レスポンスする。
クライアント側は次のリクエストのときにリクエストヘッダーに
```
if-none-match "6vewt658van9t"
```
をつけてリクエストする。サーバーはetagと比較して同一であれば304をレスポンス
ブラウザは304を受け取ったらキャッシュを使って良いと判断して、自分が持っているhtmlを画面に描画する

しばらく経ってからリロードすると
```ts
x-nextjs-cache STALE
```
HITからSTALEになる。SWR式の更新なので一度古い表示が返却される。再度リクエストすると200レスポンスされる。あとは同じ。

