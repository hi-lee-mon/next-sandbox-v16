> **Version 10.4** — **React** / **TypeScript**
> 他にも利用可能:
- Angular、Svelte、Vue、Web Components 用: `?renderer=angular`
- JavaScript、JSON 用: `?language=js`
- コードスニペットのみ: `?codeOnly=true`
- その他のバージョン: Version 9 (`/docs/9/writing-stories/mocking-data-and-modules/mocking-modules.md`)、Version 8 (`/docs/8/writing-stories/mocking-data-and-modules/mocking-modules.md`)

# モジュールをモックする

コンポーネントは、他のコンポーネント、ユーティリティ関数、ライブラリなど、別のモジュールに依存することがよくあります。これらは外部パッケージの場合もあれば、プロジェクト内部のモジュールの場合もあります。そのようなコンポーネントを Storybook でレンダリングしたり、[テスト](https://storybook.js.org/docs/writing-tests.md)したりするとき、モジュールをモックして挙動を制御し、コンポーネントの機能を分離したいことがあります。

たとえば、次のシンプルなコンポーネントは 2 つのモジュールに依存しています。ユーザーのブラウザーセッションにアクセスするローカルのユーティリティ関数と、一意な ID を生成する外部パッケージです。

```jsx title="AuthButton.jsx"

export function AuthButton() {
  const user = getUserFromSession();
  const id = uuidv4();

  return (
    <button
      onClick={() => {
        console.log(`User: ${user.name}, ID: ${id}`);
      }}
    >
      {user ? `Welcome, ${user.name}` : 'Sign in'}
    </button>
  );
}
```

上の例は React で書かれていますが、Vue、Svelte、Web Components など他のレンダラーにも同じ原則が当てはまります。重要なのは、2 つのモジュール依存関係を利用している点です。

このコンポーネントの Story やテストを書くとき、返されるユーザーデータを制御するために `getUserFromSession` 関数をモックしたり、予測可能な ID を返すために `uuidv4` 関数をモックしたりできます。これにより、これらのモジュールの実際の実装に依存せずに、コンポーネントの挙動をテストできます。

最大限の柔軟性を得られるよう、Storybook では Story でモジュールをモックする方法を 3 つ提供しています。最も単純な方法から順に見ていきます。

<a id="automocking"></a>

## 自動モック

自動モックは Storybook でモジュールをモックする最も単純な方法です。[Vite](https://storybook.js.org/docs/builders/vite.md) および [Webpack](https://storybook.js.org/docs/builders/webpack.md) ビルダーを使うすべてのプロジェクトで推奨します。それ以外のビルダーでは、後述する別の手法のいずれかを使う必要があります。この方法は設定が最小限で済み、モジュールを柔軟にモックできます。

手順は 2 つです。まず、モックしたいモジュールを Storybook 設定に登録します。次に、Story の中でモック済みモジュールの挙動を制御し、アサーションを行います。

### モック対象のモジュールを登録する

自動モックでは、`sb.mock` ユーティリティ関数を使ってモックしたいモジュールを登録します。モジュールの登録方法は、スパイのみ、完全な自動モック、モックファイルの 3 種類です。それぞれ用途と利点があります。

`sb.mock` ユーティリティを使うときは、いくつか重要な点があります。

- ローカルモジュール（例: `../lib/session.ts`）と、`node_modules` 内のパッケージ（例: `uuid`）の両方を登録できます。
- モック済みモジュールを登録できるのは、プロジェクトレベルの設定である `.storybook/preview.*` だけです。これにより、プロジェクト内のすべての Story で一貫性があり、パフォーマンスのよいモックを利用できます。Story 内でこれらのモジュールの挙動を変更することはできますが、Story ファイルで直接登録することはできません。
- ローカルモジュールのモックを登録する場合、パスは次の条件を満たす必要があります。
  - エイリアスやサブパスインポート（例: `@/lib/session.ts` や `#lib/session`）を使わない。
  - `.storybook/preview.*` ファイルからの相対パスである。
  - ファイル拡張子（例: `.ts` や `.js`）を含める。
- TypeScript を使っている場合、モジュールパスを `import()` で包むことで、モジュールが正しく解決され型付けされるようにできます。例: `sb.mock(import('../lib/session.ts'))`。
- [Webpack builder](https://storybook.js.org/docs/builders/webpack.md) を使っている場合、自動モックできる `node_module` パッケージは ESModules（ESM）エントリーポイントを持つものだけです。モジュールが CommonJS（CJS）と ESM の両方のエントリーポイントを持つ場合、Webpack は ESM エントリーを正しく解決できず、モックできません。Webpack ユーザーでも、[モックファイル](#mock-files)を用意すれば CJS の `node_module` パッケージをモックできます。

#### スパイのみ

ほとんどの場合、`spy` オプションを `true` に設定して、モック済みモジュールをスパイのみとして登録するのがよいでしょう。これにより、元のモジュールの機能はそのまま残り、必要に応じて挙動を変更したり、テストでアサーションしたりできます。

たとえば、`getUserFromSession` 関数と `uuid` パッケージの `uuidv4` 関数をスパイしたい場合、`.storybook/preview.*` ファイルで `sb.mock` ユーティリティ関数を呼び出します。

```ts
// .storybook/preview.ts|tsx — CSF 3
// your-framework は使用中のフレームワークに置き換えてください（例: react-vite、nextjs、vue3-vite、sveltekit）

// 👇 `lib/session` ローカルモジュールのすべての export を自動的にスパイします
sb.mock(import('../lib/session.ts'), { spy: true });
// 👇 `node_modules` 内の `uuid` パッケージのすべての export を自動的にスパイします
sb.mock(import('uuid'), { spy: true });

const preview: Preview = {
  // ...
};

export default preview;
```

```ts
// .storybook/preview.tsx — CSF Next 🧪
// your-framework は使用中のフレームワークに置き換えてください（例: react-vite、nextjs、nextjs-vite）

// 👇 `lib/session` ローカルモジュールのすべての export を自動的にスパイします
sb.mock(import('../lib/session.ts'), { spy: true });
// 👇 `node_modules` 内の `uuid` パッケージのすべての export を自動的にスパイします
sb.mock(import('uuid'), { spy: true });

export default definePreview({
  // ...
});
```

より深いインポートパスを持つ外部モジュール（例: `lodash-es/add`）をモックする必要がある場合は、そのパスでモックを登録します。

その後、Story 内で[これらのモジュールの挙動を制御](#using-automocked-modules-in-stories)し、関数が呼び出されたか、どの引数で呼び出されたかなどをアサーションできます。

#### 完全に自動モックされたモジュール

元のモジュールの機能が実行されないようにしたい場合は、`spy` オプションを `false` に設定します。これは既定値なので、省略しても同じです。これにより、モジュールのすべての export が [Vitest のモック関数](https://vitest.dev/api/mock.html)に自動的に置き換えられます。元の機能が実行されないことを保証しながら、挙動を制御しアサーションできます。

```ts
// .storybook/preview.ts|tsx — CSF 3
// your-framework は使用中のフレームワークに置き換えてください（例: react-vite、nextjs、vue3-vite、sveltekit）

// 👇 `lib/session` ローカルモジュールのすべての export をモック関数に自動的に置き換えます
sb.mock(import('../lib/session.ts'));
// 👇 `node_modules` 内の `uuid` パッケージのすべての export をモック関数に自動的に置き換えます
sb.mock(import('uuid'));

const preview: Preview = {
  // ...
};

export default preview;
```

```ts
// .storybook/preview.tsx — CSF Next 🧪
// your-framework は使用中のフレームワークに置き換えてください（例: react-vite、nextjs、nextjs-vite）

// 👇 `lib/session` ローカルモジュールのすべての export をモック関数に自動的に置き換えます
sb.mock(import('../lib/session.ts'));
// 👇 `node_modules` 内の `uuid` パッケージのすべての export をモック関数に自動的に置き換えます
sb.mock(import('uuid'));

export default definePreview({
  // ...
});
```

完全に自動モックされたモジュールでは、export された関数は実行されませんが、モジュール自体とその依存関係は引き続き評価されます。つまり、そのモジュールに副作用（例: グローバル状態の変更、コンソールへのログ出力など）がある場合、その副作用は発生します。同様に、サーバー上で実行される前提で書かれたモジュールも、ブラウザー内で評価されようとします。元のモジュールのコードが完全に実行されないようにしたい場合は、代わりに[モックファイル](#mock-files)を使ってください。

その後、スパイのみの方法と同じように、Story 内で[これらのモジュールの挙動を制御](#using-automocked-modules-in-stories)し、アサーションできます。

<a id="mock-files"></a>

#### モックファイル

より複雑な挙動でモジュールをモックしたい場合や、複数の Story でモックの挙動を再利用したい場合は、モックファイルを作成できます。このファイルは、モックしたいモジュールの隣にある `__mocks__` ディレクトリに配置し、元のモジュールと同じ名前付き export を export する必要があります。

たとえば、`lib` ディレクトリ内の `session` モジュールをモックするには、`lib/__mocks__` ディレクトリに `session.js|ts` という名前のファイルを作成します。

```js title="lib/__mocks__/session.js"
export function getUserFromSession() {
  return { name: 'Mocked User' };
}
```

`node_modules` 内のパッケージについては、プロジェクトのルートに `__mocks__` ディレクトリを作成し、その中にモックファイルを作成します。たとえば `uuid` パッケージをモックするには、`__mocks__` ディレクトリに `uuid.js` という名前のファイルを作成します。

```js title="__mocks__/uuid.js"
export function v4() {
  return '1234-5678-90ab-cdef';
}
```

より深いインポートパスを持つ外部モジュール（例: `lodash-es/add`）をモックする必要がある場合は、プロジェクトのルートに対応するモックファイル（例: `__mocks__/lodash-es/add.js`）を作成します。

プロジェクトのルートは、使用するビルダーによって決まり方が異なります。

**Vite プロジェクト**

ルートの `__mocks__` ディレクトリは、プロジェクトの Vite 設定で定義された [`root` ディレクトリ](https://vite.dev/config/shared-options.html#root)に配置します。通常は `process.cwd()` です。それが利用できない場合は、`.storybook` ディレクトリを含むディレクトリが既定値になります。

**Webpack プロジェクト**

ルートの `__mocks__` ディレクトリは、プロジェクトの Webpack 設定で定義された [`context` ディレクトリ](https://webpack.js.org/configuration/entry-context/#context)に配置します。通常は `process.cwd()` です。それが利用できない場合は、リポジトリのルートが既定値になります。

モックファイルは、ESModules（CJS ではありません）を使った JavaScript（TypeScript ではありません）で書く必要があります。

元のモジュールと同じ名前付き export を export する必要があります。デフォルト export をモックしたい場合は、モックファイルで `export default` を使えます。

その後、`sb.mock` ユーティリティを使って、これらのモックファイルを `preview.*` ファイルに登録できます。

```ts
// .storybook/preview.ts|tsx — CSF 3
// your-framework は使用中のフレームワークに置き換えてください（例: react-vite、nextjs、vue3-vite、sveltekit）

// 👇 このモジュールの import を `../lib/__mocks__/session.ts` への import に置き換えます
sb.mock(import('../lib/session.ts'));
// 👇 このモジュールの import を `../__mocks__/uuid.ts` への import に置き換えます
sb.mock(import('uuid'));

const preview: Preview = {
  // ...
};

export default preview;
```

```ts
// .storybook/preview.tsx — CSF Next 🧪
// your-framework は使用中のフレームワークに置き換えてください（例: react-vite、nextjs、nextjs-vite）

// 👇 このモジュールの import を `../lib/__mocks__/session.ts` への import に置き換えます
sb.mock(import('../lib/session.ts'));
// 👇 このモジュールの import を `../__mocks__/uuid.ts` への import に置き換えます
sb.mock(import('uuid'));

export default definePreview({
  // ...
});
```

自動モックされたモジュールとモックファイルを登録する API は同じです。違いは、`sb.mock` がモジュールを自動的にモックする前に、適切なディレクトリでモックファイルを先に探す点だけです。

<a id="using-automocked-modules-in-stories"></a>

### Story で自動モック済みモジュールを使う

登録されたすべての自動モック済みモジュールは、Story 内で同じ方法で使います。戻り値の定義などの挙動を制御し、モジュールについてアサーションできます。

```ts
// AuthButton.stories.ts — CSF 3
// your-framework は使用中のフレームワーク名に置き換えてください（例: react-vite、vue3-vite など）

const meta = {
  component: AuthButton,
  // 👇 各 Story がレンダリングされる前に実行されます
  beforeEach: async () => {
    // 👇 モック済みモジュールに既知で一貫した挙動を強制します
    mocked(uuidv4).mockReturnValue('1234-5678-90ab-cdef');
    mocked(getUserFromSession).mockReturnValue({ name: 'John Doe' });
  },
} satisfies Meta<typeof AuthButton>;
export default meta;

type Story = StoryObj<typeof meta>;

export const LogIn: Story = {
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Sign in' });
    userEvent.click(button);

    // getUserFromSession 関数が呼び出されたことをアサートします
    expect(getUserFromSession).toHaveBeenCalled();
  },
};
```

```ts
// AuthButton.stories.ts — CSF Next 🧪

const meta = preview.meta({
  component: AuthButton,
  // 👇 各 Story がレンダリングされる前に実行されます
  beforeEach: async () => {
    // 👇 モック済みモジュールに既知で一貫した挙動を強制します
    mocked(uuidv4).mockReturnValue('1234-5678-90ab-cdef');
    mocked(getUserFromSession).mockReturnValue({ name: 'John Doe' });
  },
});

export const LogIn = meta.story({
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Sign in' });
    userEvent.click(button);

    // getUserFromSession 関数が呼び出されたことをアサートします
    expect(getUserFromSession).toHaveBeenCalled();
  },
});
```

`sb.mock` ユーティリティで作成されたモック関数は完全な [Vitest のモック関数](https://vitest.dev/api/mock.html)なので、利用可能なすべてのメソッドを使えます。特に便利なメソッドには次のものがあります。

| メソッド                                                                         | 説明                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [`mockReturnValue(value)`](https://vitest.dev/api/mock.html#mockreturnvalue)     | モック関数の戻り値を設定します。                       |
| [`mockResolvedValue(value)`](https://vitest.dev/api/mock.html#mockresolvedvalue) | モックされた async 関数が resolve する値を設定します。 |
| [`mockImplementation(fn)`](https://vitest.dev/api/mock.html#mockimplementation)  | モック関数のカスタム実装を設定します。                 |

[TypeScript で Story を書いている](https://storybook.js.org/docs/writing-stories/typescript.md)場合は、`storybook/test` の `mocked` ユーティリティを使うことで、Story 内のモック関数が正しく型付けされるようにできます。このユーティリティは、Vitest の `vi.mocked` 関数の型安全なラッパーです。

### 仕組み

Storybook の自動モックは Vitest のモックエンジンを基盤にしています。挙動は、開発モードかビルドモードかによって変わります。

**開発モード**

開発モードでは、モックは Vite のモジュールグラフ無効化に依存します。モックが追加、変更、削除されると（`.storybook/preview.*` または `__mocks__` ディレクトリのどちらであっても）、プラグインは影響を受けるすべてのモジュールを適切に無効化し、ホットリロードをトリガーします。これにより、高速でインタラクティブな開発体験が得られます。

**開発モードとビルドモード**

- ビルド時解析: 新しい Vite プラグイン `viteMockPlugin` が、ビルドプロセス中に `.storybook/preview.*` をスキャンし、すべての `sb.mock()` 呼び出しを検出します。
- モック処理:
  - `__mocks__` リダイレクト: 対応するファイルが最上位の `__mocks__` ディレクトリで見つかった場合、そのファイルが Vite によって読み込まれ、変換されます。
  - 自動モックとスパイ: `__mocks__` ファイルが見つからない場合、元のモジュールのコードがビルド時に変換され、export がモックまたはスパイに置き換えられます。
- ランタイムオーバーヘッドなし: すべてのモックの判断と変換はビルド時に行われるため、最終的にビルドされたアプリケーションにはパフォーマンス上のペナルティや複雑なインターセプトロジックは不要です。モック済みモジュールは、元のモジュールの代わりに直接バンドルされます。

#### Vitest のモックとの比較

この機能は Vitest のモックエンジンを使っていますが、Storybook 内での実装にはいくつか重要な違いがあります。

- スコープ: モックはグローバルで、`.storybook/preview.*` 内でのみ定義されます。Vitest とは異なり、個別の Story ファイル内で `sb.mock()` を呼び出すことはできません。
- 静的な設計: すべてのモックの判断はビルド時に確定します。これにより、仕組みは堅牢で高性能になりますが、Vitest のテストごとのモック機能ほど動的ではありません。プロダクションビルドではモジュールグラフが固定されるため、`sb.unmock()` や同等のものはありません。
- ランタイムでのモック制御: モジュールの差し替えは静的ですが、play 関数や `beforeEach` フック内で、モック関数の挙動をランタイムに制御することはできます（例: `mocked(myFunction).mockReturnValue('new value')`）。
- ファクトリ関数なし: `sb.mock()` API は、第 2 引数としてファクトリ関数（例: `sb.mock('path', () => ({...}))`）を受け取りません。これは、すべてのモック判断がビルド時に解決される一方で、ファクトリはランタイムに実行されるためです。

## 代替手法

[自動モック](#automocking)がプロジェクトに適していない場合、Storybook でモジュールをモックする代替手法が 2 つあります。[サブパスインポート](#subpath-imports)と[ビルダーエイリアス](#builder-aliases)です。これらの方法は少し多くの設定が必要ですが、自動モックと同様の機能を提供し、Story 内でモジュールの挙動を制御できます。

<a id="subpath-imports"></a>

### サブパスインポート

Node の機能である[サブパスインポート](https://nodejs.org/api/packages.html#subpath-imports)を使って、モジュールをモックできます。サブパスインポートでは、プロジェクト内のモジュールに対してカスタムパスを定義できます。このパスを使って、元のモジュールをモックファイルに置き換えられます。[Vite](https://storybook.js.org/docs/builders/vite.md) と [Webpack](https://storybook.js.org/docs/builders/webpack.md) の両方のビルダーで動作します。

<a id="mock-files-1"></a>

#### モックファイル

モジュールをモックするには、モックしたいモジュールと同じ名前で、同じディレクトリにファイルを作成します。たとえば `session` という名前のモジュールをモックするには、その隣に `session.mock.js|ts` という名前のファイルを作成します。このファイルにはいくつかの特徴があります。

- 相対インポートを使って元のモジュールを import する必要があります。
  - サブパスまたはエイリアスインポートを使うと、自分自身を import してしまいます。
- 元のモジュールのすべての export を再 export する必要があります。
- 元のモジュールから必要な機能をモックするために、`fn` ユーティリティを使う必要があります。
- 圧縮時にも名前が保持されるように、[`mockName`](https://vitest.dev/api/mock.html#mockname) メソッドを使う必要があります。
- 他のテストやコンポーネントに影響する副作用を導入しないでください。モックファイルは分離され、モック対象のモジュールだけに影響するべきです。

`session` という名前のモジュール用のモックファイルの例を示します。

```ts
// lib/session.mock.ts

export * from './session';
export const getUserFromSession = fn(actual.getUserFromSession).mockName('getUserFromSession');
```

`fn` ユーティリティを使ってモジュールをモックすると、完全な [Vitest のモック関数](https://vitest.dev/api/mock.html)を作成できます。Story 内でモック済みモジュールを使う例については、[下記](#using-mocked-modules-in-stories)を参照してください。

**外部モジュール用のモックファイル**

[`uuid`](https://github.com/uuidjs/uuid) や `node:fs` のような外部モジュールを直接モックすることはできません。代わりに、その外部モジュールを自分のモジュールでラップし、そのラッパーを他の内部モジュールと同じようにモックする必要があります。たとえば `uuid` では、次のようにできます。

```ts title="lib/uuid.ts"

export const uuidv4 = v4;
```

そして、そのラッパー用のモックを作成します。

```ts title="lib/uuid.mock.ts"

export const uuidv4 = fn(actual.uuidv4).mockName('uuidv4');
```

#### 設定

サブパスインポートを設定するには、プロジェクトの `package.json` ファイルで `imports` プロパティを定義します。このプロパティは、サブパスを実際のファイルパスに対応付けます。次の例では、4 つの内部モジュールに対してサブパスインポートを設定しています。

```jsonc
// package.json
{
  "imports": {
    "#api": {
      // storybook 条件は Storybook に適用されます
      "storybook": "./api.mock.ts",
      "default": "./api.ts",
    },
    "#app/actions": {
      "storybook": "./app/actions.mock.ts",
      "default": "./app/actions.ts",
    },
    "#lib/session": {
      "storybook": "./lib/session.mock.ts",
      "default": "./lib/session.ts",
    },
    "#lib/db": {
      // test 条件はテスト環境と Storybook の両方に適用されます
      "test": "./lib/db.mock.ts",
      "default": "./lib/db.ts",
    },
    "#*": ["./*", "./*.ts", "./*.tsx"],
  },
}
```

この設定には、注目すべき点が 3 つあります。

まず、通常のモジュールパスと区別するため、**各サブパスは `#` で始まる必要があります**。`#*` エントリは、すべてのサブパスをルートディレクトリに対応付けるキャッチオールです。

次に、キーの順序が重要です。`default` キーは最後に置く必要があります。

3 つ目に、各モジュールのエントリにある **`storybook`、`test`、`default` キー**に注目してください。Storybook に読み込まれるときは `storybook` の値を使ってモックファイルを import し、プロジェクト内で読み込まれるときは `default` の値を使って元のモジュールを import します。`test` 条件も Storybook 内で使われるため、Storybook と他のテストで同じ設定を利用できます。

パッケージ設定ができたら、コンポーネントファイルを更新してサブパスインポートを使うようにします。

```ts title="AuthButton.ts"
// ➖ この行を削除
// import { getUserFromSession } from '../../lib/session';
// ➕ この行を追加

// ...ファイルの残り
```

サブパスインポートが正しく解決され、型付けされるのは、TypeScript 設定で [`moduleResolution` プロパティ](https://www.typescriptlang.org/tsconfig/#moduleResolution)が `'Bundler'`、`'NodeNext'`、または `'Node16'` に設定されている場合だけです。

現在 `'node'` を使っている場合、それは v10 より古い Node.js バージョンを使うプロジェクト向けの設定です。モダンなコードで書かれたプロジェクトでは、おそらく `'node'` を使う必要はありません。

Storybook は、TypeScript 設定のセットアップに関するガイダンスとして [TSConfig Cheat Sheet](https://www.totaltypescript.com/tsconfig-cheat-sheet) を推奨しています。

<a id="using-mocked-modules-in-stories"></a>
<a id="using-subpath-imports-in-stories"></a>

#### Story でサブパスインポートを使う

`fn` ユーティリティを使ってモジュールをモックすると、完全な [Vitest のモック関数](https://vitest.dev/api/mock.html)が作成され、多くのメソッドを利用できます。特に便利なメソッドには次のものがあります。

| メソッド                                                                         | 説明                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [`mockReturnValue(value)`](https://vitest.dev/api/mock.html#mockreturnvalue)     | モック関数の戻り値を設定します。                       |
| [`mockResolvedValue(value)`](https://vitest.dev/api/mock.html#mockresolvedvalue) | モックされた async 関数が resolve する値を設定します。 |
| [`mockImplementation(fn)`](https://vitest.dev/api/mock.html#mockimplementation)  | モック関数のカスタム実装を設定します。                 |

ここでは、Story に `beforeEach` を定義して（Story がレンダリングされる前に実行されます）、Page コンポーネントで使われる `getUserFromSession` 関数のモック戻り値を設定します。

```ts
// Page.stories.ts — CSF 3
// your-framework は使用中のフレームワークに置き換えてください（例: react-vite、nextjs、vue3-vite など）

// 👇 自動モック済みモジュールは '../lib/__mocks__/session' に解決されます

const meta = {
  component: Page,
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  async beforeEach() {
    // 👇 getUserFromSession 関数の戻り値を設定します
    mocked(getUserFromSession).mockReturnValue({ id: '1', name: 'Alice' });
  },
};
```

```ts
// Page.stories.ts — CSF Next 🧪

// 👇 自動モック済みモジュールは '../lib/__mocks__/session' に解決されます

const meta = preview.meta({
  component: Page,
});

export const Basic = meta.story({
  async beforeEach() {
    // 👇 getUserFromSession 関数の戻り値を設定します
    mocked(getUserFromSession).mockReturnValue({ id: '1', name: 'Alice' });
  },
});
```

[TypeScript で Story を書いている](https://storybook.js.org/docs/writing-stories/typescript.md)場合、Story 内で関数を正しく型付けするには、完全なモックファイル名を使ってモックモジュールを import する必要があります。コンポーネントファイルではこれを行う必要は**ありません**。そのために[サブパスインポート](#subpath-imports)または[ビルダーエイリアス](#builder-aliases)があります。

#### モック済みモジュールをスパイする

`fn` ユーティリティは元のモジュールの関数もスパイするため、テストでその挙動をアサーションできます。たとえば、[インタラクションテスト](https://storybook.js.org/docs/writing-tests/interaction-testing.md)を使って、関数が特定の引数で呼び出されたことを検証できます。

次の Story では、ユーザーが保存ボタンをクリックしたときに `saveNote` 関数が呼び出されたことを確認しています。

```ts
// NoteUI.stories.ts — CSF 3
// your-framework は使用中のフレームワークに置き換えてください（例: react-vite、nextjs、vue3-vite など）

// 👇 自動モック済みモジュールは '../app/__mocks__/actions' に解決されます

const meta = { component: NoteUI } satisfies Meta<typeof NoteUI>;
export default meta;

type Story = StoryObj<typeof meta>;

const notes = createNotes();

export const SaveFlow: Story = {
  name: 'Save Flow ▶',
  args: {
    isEditing: true,
    note: notes[0],
  },
  play: async ({ canvas, userEvent }) => {
    const saveButton = canvas.getByRole('menuitem', { name: /done/i });
    await userEvent.click(saveButton);
    // 👇 これはモック関数なので、その挙動をアサートできます
    await expect(saveNote).toHaveBeenCalled();
  },
};
```

```ts
// NoteUI.stories.ts — CSF Next 🧪

// 👇 自動モック済みモジュールは '../app/__mocks__/actions' に解決されます

const meta = preview.meta({ component: NoteUI });

const notes = createNotes();

export const SaveFlow = meta.story({
  name: 'Save Flow ▶',
  args: {
    isEditing: true,
    note: notes[0],
  },
  play: async ({ canvas, userEvent }) => {
    const saveButton = canvas.getByRole('menuitem', { name: /done/i });
    await userEvent.click(saveButton);
    // 👇 これはモック関数なので、その挙動をアサートできます
    await expect(saveNote).toHaveBeenCalled();
  },
});
```

<a id="builder-aliases"></a>

### ビルダーエイリアス

プロジェクトで[自動モック](#automocking)や[サブパスインポート](#subpath-imports)を使えない場合は、Storybook ビルダーを設定して、モジュールを[モックファイル](#mock-files-1)へエイリアスできます。これにより、Storybook の Story をバンドルするとき、ビルダーにそのモジュールをモックファイルへ置き換えさせることができます。

```ts
// .storybook/main.ts — Vite (CSF 3)
// your-framework は使用中のフレームワークに置き換えてください（例: react-vite、nextjs-vite、vue3-vite など）

const config: StorybookConfig = {
  framework: '@storybook/your-framework',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  viteFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve?.alias,
        // 👇 外部モジュール
        lodash: import.meta.resolve('./lodash.mock'),
        // 👇 内部モジュール
        '@/api': import.meta.resolve('./api.mock.ts'),
        '@/app/actions': import.meta.resolve('./app/actions.mock.ts'),
        '@/lib/session': import.meta.resolve('./lib/session.mock.ts'),
        '@/lib/db': import.meta.resolve('./lib/db.mock.ts'),
      };
    }

    return config;
  },
};

export default config;
```

```ts
// .storybook/main.ts — Webpack (CSF 3)
// your-framework は使用中のフレームワークに置き換えてください（例: nextjs、react-webpack5）

const config: StorybookConfig = {
  framework: '@storybook/your-framework',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // 👇 外部モジュール
        lodash: import.meta.resolve('./lodash.mock'),
        // 👇 内部モジュール
        '@/api$': import.meta.resolve('./api.mock.ts'),
        '@/app/actions$': import.meta.resolve('./app/actions.mock.ts'),
        '@/lib/session$': import.meta.resolve('./lib/session.mock.ts'),
        '@/lib/db$': import.meta.resolve('./lib/db.mock.ts'),
      };
    }

    return config;
  },
};

export default config;
```

```ts
// .storybook/main.ts — Vite (CSF Next 🧪)
// your-framework は使用中のフレームワークに置き換えてください（例: react-vite、nextjs-vite）

export default defineMain({
  framework: '@storybook/your-framework',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  viteFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve?.alias,
        // 👇 外部モジュール
        lodash: import.meta.resolve('./lodash.mock'),
        // 👇 内部モジュール
        '@/api': import.meta.resolve('./api.mock.ts'),
        '@/app/actions': import.meta.resolve('./app/actions.mock.ts'),
        '@/lib/session': import.meta.resolve('./lib/session.mock.ts'),
        '@/lib/db': import.meta.resolve('./lib/db.mock.ts'),
      };
    }

    return config;
  },
});
```

```ts
// .storybook/main.ts — Webpack (CSF Next 🧪)
// your-framework は使用中のフレームワークに置き換えてください（例: nextjs、react-webpack5）

export default defineMain({
  framework: '@storybook/your-framework',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // 👇 外部モジュール
        lodash: import.meta.resolve('./lodash.mock'),
        // 👇 内部モジュール
        '@/api$': import.meta.resolve('./api.mock.ts'),
        '@/app/actions$': import.meta.resolve('./app/actions.mock.ts'),
        '@/lib/session$': import.meta.resolve('./lib/session.mock.ts'),
        '@/lib/db$': import.meta.resolve('./lib/db.mock.ts'),
      };
    }

    return config;
  },
});
```

Story 内でエイリアスされたモジュールを使う方法は、[Story でサブパスインポートを使う](#using-subpath-imports-in-stories)場合と似ています。ただし、サブパスではなくエイリアスを使ってモジュールを import します。

---

## よくあるシナリオ

### セットアップとクリーンアップ

Story がレンダリングされる前に、非同期の `beforeEach` 関数を使って必要なセットアップ（例: モック挙動の設定）を行えます。この関数は、Story、コンポーネント（ファイル内のすべての Story で実行されます）、またはプロジェクト（`.storybook/preview.*` に定義され、プロジェクト内のすべての Story で実行されます）で定義できます。

また、`beforeEach` からクリーンアップ関数を返すこともでき、その関数は Story がアンマウントされた後に呼び出されます。これは、オブザーバーの購読解除などの作業に便利です。

Storybook は Story をレンダリングする前に自動的にそれを行うため、クリーンアップ関数で `fn()` モックを復元する必要は_ありません_。詳しくは [`parameters.test.restoreMocks` API](https://storybook.js.org/docs/api/parameters.md#restoremocks) を参照してください。

次は、[`mockdate`](https://github.com/boblauer/MockDate) パッケージを使って [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) をモックし、Story がアンマウントされたときにリセットする例です。

```ts
// Page.stories.ts — CSF 3
// your-framework は使用中のフレームワークに置き換えてください（例: react-vite、nextjs、vue3-vite など）

const meta = {
  component: Page,
  // 👇 ファイル内のすべての Story に対して Date の値を設定します
  async beforeEach() {
    MockDate.set('2024-02-14');

    // 👇 各 Story の後に Date をリセットします
    return () => {
      MockDate.reset();
    };
  },
} satisfies Meta<typeof Page>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  async play({ canvas }) {
    // ... これはモックされた Date で実行されます
  },
};
```

```ts
// Page.stories.ts — CSF Next 🧪

const meta = preview.meta({
  component: Page,
  // 👇 ファイル内のすべての Story に対して Date の値を設定します
  async beforeEach() {
    MockDate.set('2024-02-14');

    // 👇 各 Story の後に Date をリセットします
    return () => {
      MockDate.reset();
    };
  },
});

export const Basic = meta.story({
  async play({ canvas }) {
    // ... これはモックされた Date で実行されます
  },
});
```

---

## トラブルシューティング

### `exports is not defined` エラーを受け取る

Webpack プロジェクトでは、[自動モック](#automocking)を使うと `exports is not defined` エラーが発生することがあります。これは通常、CommonJS（CJS）エントリーポイントを持つモジュールをモックしようとしたことが原因です。Webpack での自動モックは、ESModules（ESM）エントリーポイントのみを持つモジュールでしか動作しないため、CJS モジュールをモックするには[モックファイル](#mock-files)を使う必要があります。

### モックが他のテストツールと競合する

すでに他のテストツール（例: [Jest](https://jestjs.io/)）でモックを設定している場合、Storybook のモックシステムを使うと競合が発生することがあります。この競合により、両方のツールが同じモジュールをモックしようとしたとき、予期しない挙動、エラー、不正なモックが発生する可能性があります。これは、Storybook と他のテストツールの間でモックファイルや設定を共有する場合の既知の問題です。この状況に対処するには、特定のモジュールのモックをどのツールが担当しているかを確認し、競合を避けるために設定が重複していないことを確認することをおすすめします。
