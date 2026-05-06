一度レンダリングされたら再レンダリングされない。
アンマウント→マウントはもちろん再レンダリングされる

以下のパターンだと覚えておけばOK

1. /から/aboutでRootLayoutとabout-layout
2. /aboutから/about/piyoでレンダリングなし
3. /about/piyoから/でレンダリングなし
4. /から/aboutでabout-layoutだけレンダリング
5. /aboutから/profileでprofile-layoutだけレンダリング