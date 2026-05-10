アイランドアーキテクチャとRSCというアーキテクチャは似ている。
「静的な部分は静的として扱い、インタラクティブな部分は動的と扱えるようにする。」
これはどちらのアーキテクチャでも行っていること。

Astroの場合は基本的にサーバー側でHTMLを生成し、
一部インタラクティブな部分だけをクライアントでhydrateする。

つまりAstroは、
「HTMLを基本として、必要な部分だけJSを送る」
という思想。

Astroの静的とは、最終成果物として静的HTMLを生成するという意味。

これはRSCの静的とは少し異なる。
RSCの静的とは「Server Componentを事前実行・キャッシュ可能」という意味合いが強い。

AstroはSSG/SSRの両方が可能であり、
実行環境がクライアントしかないわけではない。

ただし、インタラクティブなUIを動かす場合は、
その部分のJSをクライアントへ送る必要がある。

つまりAstroでは、クライアント側で動くUIについては、そのコンポーネントのロジック・状態管理・レンダリング用JSを送信する。

Astroでは、インタラクティブなミューテーションを行う場合、
その状態管理やfetchロジックをクライアントへ送る必要がある。

そのため、
SWRやReact Queryのようなライブラリを
client bundleへ含めるケースが多くなる。

一方RSC + Server Actionsでは、
mutation処理やデータ処理の多くを
サーバー側へ閉じ込められる。

Astroは「hydrateしない」のではなく、
必要な島(Island)だけ部分hydrateする。

ではRSCを考えてみる。

まずRSCにはサーバーがある。
（厳密にはサーバーなしで動かすことも可能。
build時に全てHTML化すればSSR runtimeは不要になる）

つまりJSが必要な処理だったとしても、
サーバー側だけで実行してクライアントには送らないことが可能になる。

完全にクライアントJS不要な部分を作れる。

このとき重要なのは、
「JSが不要なのはクライアント側」
ということ。

サーバー側では当然JSは動いている。

Astroでは、インタラクティブ部分については
そのロジックをクライアントへ送る必要がある。

一方RSCでは、
fetch、データ整形、レンダリングなどを
Server Componentとしてサーバー側だけで完結できる。

つまりRSCでは、
DBアクセス、
fetch処理、
データ加工、
render処理などをサーバーに閉じ込められる。

その結果、
クライアントへ送るのはHTMLや最小限のデータだけでよくなる。

またミューテーションについても、
Server Functions / Server Actionsを使用すれば、
データ処理の多くをサーバー側へ寄せられる。

## PPR

PPRは、
ページ単位ではなくコンポーネント単位で
静的/動的を分割できるようにする技術。

従来では、

- SSG（全部静的）
- SSR（全部動的）

の2択になりやすかった。

PPRではこれを混在できる。

つまり、

Server Component を
「いつレンダリングするか」

で分割する。

PPRではRSCベースのページを、

1. 静的に即返せる部分
2. 後から動的に埋める部分

に分離する。

整理すると、

- Static SC（build時/prerender）
- Dynamic SC（request時実行）
- CC（client hydrate必要）

に分けられる。

具体例としてユーザページを考える。

- Header/Article → 静的HTMLとして即返す
- UserProfile → 後からstreaming

つまり、

SCの中に
「静的SC」と「動的SC」が共存できる。

### どうやってPPRするか？

Suspense boundaryで境界を作る。

ただし、
「Suspenseで囲めば必ずDynamic」
というわけではない。

request依存のデータ、
cookies()、
headers()、
認証情報、
uncached fetchなどを使用するSCが
Dynamic SCになる。

そしてそのDynamic SCを
Suspense boundary単位で分離し、
後からstreamingする。

つまりPPRは、

- RSC
- Suspense
- Streaming
- 静的解析

を組み合わせて、

「dynamic rendering範囲を最小化する」

技術と言える。