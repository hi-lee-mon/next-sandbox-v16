https://markuplint.dev/ja/docs/guides
ガイドにしたがいインストール
```bash
pnpx markuplint --init
```
質問に対しての回答は以下
```bash
✔ Install npm dependencies? (y/N) · false
✔ Do you customize rules? (y/N) · false
✔ Does it import the recommended config? (y/N) · true
```
するとmarkuplintrcという設定ファイルが作られた。
```json
{
  "extends": [
    "markuplint:recommended"
  ]
}
```

npmインストールでYesにしたらエラーになったので別途pnpmインストールした
```bash
pnpm i -D markuplint
```

静的チェックのために公式のvscode拡張機能がある。ダウンロードしたのち
```
<img/>
```
ちゃんと怒られることを確認

jsxで使うには以下も入れる必要があるので追加
```bash
pnpm add -D @markuplint/jsx-parser @markuplint/react-spec
```
さらにさっきの設定ファイルに追記
```json
{
  "extends": [
    "markuplint:recommended"
  ],
  "parser": {
    "\\.[jt]sx$": "@markuplint/jsx-parser"
  },
  "specs": {
    "\\.[jt]sx$": "@markuplint/react-spec"
  }
}
```

あとはpackage.jsonにスクリプトを追加。あまり良くない命名だけど個人開発だし短めのスクリプト名にしちゃう
```
"muplint": "markuplint \"./app/**/*.{jsx,tsx}\""
```

