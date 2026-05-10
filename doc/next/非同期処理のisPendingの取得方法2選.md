非同期処理のisPendingがほしいときの2パターンは以下の通り。

参照系=suspense

更新系=非同期transition

でOK

初期表示はsuspenseで大きめのスケルトンUIを表示しつつ
アクションで小さなisPendingを取得して表示を制御する。（テーブルだけpendingの見た目にするとか）




