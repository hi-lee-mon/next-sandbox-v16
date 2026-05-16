@theme inlineを使うとtailwindcssのユーティリティクラスを上書きすることができる。
下記であればfont-sansというユーティリティクラスの内容を右辺で上書きする。
```css
@theme inline {
    --font-sans: var(--font-noto-sans-jp);
```