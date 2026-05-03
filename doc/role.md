layout.tsxで権限チェックを行ってみた。

結果は以下の通り。
layout.tsxとloading.tsxの動きを見てみると
/から/aboutへ遷移すると/loadingが発火して、非同期完了するまで/about/pageは表示されなかった。
したがってpageが見えることはなさそう。
また/about/loadingは表示すらされなかった。

流れとしては/から/aboutに遷移しようとしたが、/about/layoutが非同期処理なのでRootのloadingがサスペンド
サスペンド解決で再レンダリングでレンダリング成功で/about/pageが表示される