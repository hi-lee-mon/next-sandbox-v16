@theme inlineを使うとtailwindcssのユーティリティクラスを上書きすることができる。
下記であればfont-sansというユーティリティクラスの内容を右辺で上書きする。
```css
@theme inline {
    --font-sans: var(--font-noto-sans-jp);
```

要はutilityクラスの設定

ではCSS変数はどこからきているのか？

それは:rootと:dark

ここでは全く同じCSS変数名で定義する。

つまり:rootはrightモードのカラーになる。:rootはcssの構文であり、グローバルに定義する事ができる機能。<html>にcssを定義するより優先度は高いので上書きされづらくなる。
