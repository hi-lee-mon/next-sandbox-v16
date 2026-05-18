server actionで使用できる。

- ページ上のSCを全て再実行する。

- use cacheかつキャッシュパージされてない場合はキャッシュから即返る

- ページ再レンダリングをスキップするか？というフラグ(skipPageRendering)をfalseにしてSCを実行しつつ、RSCペイロードをレスポンスする


| 状況                      | `pathWasRevalidated`                  | `skipPageRendering` | レスポンス          |
| ------------------------- | ------------------------------------- | ------------------- | ------------------- |
| `refresh()` 呼んだ        | `ActionDidRevalidateDynamicOnly`      | **false**           | 返り値 ＋ RSCツリー |
| `revalidatePath()` 呼んだ | `ActionDidRevalidateStaticAndDynamic` | **false**           | 返り値 ＋ RSCツリー |
| 何も呼ばなかった          | `undefined`                           | true                | 返り値のみ          |

`refresh()` を呼ぶと `skipPageRendering = false`（スキップしない）= **ページも再レンダリングしてRSCをついでに返す** という分岐に入ります。

`updateBlogTag` のレスポンスがなぜ RSC ツリーを含むのか、というのはこのフラグが `false` になっているからで、`refresh()` を呼んだことが引き金でした。