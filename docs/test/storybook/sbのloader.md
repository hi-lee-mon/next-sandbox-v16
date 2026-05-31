loaderは非同期関数でstoryのレンダリング前に実行される
エスケープハッチであることに注意。

基本的にはargsを使ってできない場合に使う。

sbはargsで最適化されており、loaderを使用すると機能が使えなくなる可能性がある。


```tsx
import preview from '../.storybook/preview';

import { TodoItem } from './TodoItem';

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
const meta = preview.meta({
  component: TodoItem,
  render: (args, { loaded: { todo } }) => <TodoItem {...args} {...todo} />,
});

export const Primary = meta.story({
  loaders: [
    async () => ({
      todo: await (await fetch('https://jsonplaceholder.typicode.com/todos/1')).json(),
    }),
  ],
});
```
renderがstoryのレンダリング。loadersはそれよりも前に実行される。
なので、storyのrenderでloadedにアクセスすることでレンダリング時に使用できる。
