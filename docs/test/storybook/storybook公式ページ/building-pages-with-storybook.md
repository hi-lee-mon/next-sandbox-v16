> **Version 10.4** — **React** / **TypeScript**
> ほかの形式も利用できます:
- Angular、Solid、Svelte、Vue、Web Components 向けは `?renderer=angular`
- JavaScript 向けは `?language=js`
- コードスニペットのみは `?codeOnly=true`
- ほかのバージョン: Version 9 (`/docs/9/writing-stories/build-pages-with-storybook.md`)、Version 8 (`/docs/8/writing-stories/build-pages-with-storybook.md`)

# Storybook でページを構築する

Storybook は、小さな「アトミック」コンポーネントから、それらを組み合わせたページまで、あらゆるコンポーネントの構築を支援します。ただし、コンポーネント階層をページレベルへ上げていくほど、扱う複雑さも増していきます。

Storybook でページを構築する方法はいくつもあります。ここでは一般的なパターンと解決策を紹介します。

- 純粋なプレゼンテーショナルページ。
- 接続されたコンポーネント（例: ネットワークリクエスト、Context、ブラウザー環境）。

## 純粋なプレゼンテーショナルページ

BBC、The Guardian、Storybook のメンテナー自身のチームでは、純粋なプレゼンテーショナルページを構築しています。このアプローチを取る場合、Storybook でページをレンダリングするために特別なことをする必要はありません。

コンポーネントを画面レベルまで完全にプレゼンテーショナルに書くことは難しくありません。そうしておくと Storybook で表示しやすくなります。考え方としては、面倒な「接続」ロジックは Storybook の外側にあるアプリ内の単一のラッパーコンポーネントで行います。このアプローチの例は、Intro to Storybook チュートリアルの [Data](https://storybook.js.org/tutorials/intro-to-storybook/react/en/data/) の章で確認できます。

利点:

- コンポーネントがこの形になっていれば Story を書きやすい。
- Story のすべてのデータが Story の args にエンコードされるため、Storybook のほかのツール（例: [controls](https://storybook.js.org/docs/essentials/controls.md)）とうまく連携する。

欠点:

- 既存のアプリがこのような構造になっていない場合があり、変更が難しいことがある。

- 1 か所でデータを取得するということは、そのデータを利用するコンポーネントまで受け渡していく必要があるということです。たとえば大きな GraphQL クエリを 1 つ組み立てるページでは自然ですが、ほかのデータ取得アプローチではあまり適さない場合があります。

- 画面上の複数の場所でデータを段階的に読み込みたい場合、柔軟性が低くなる。

### プレゼンテーショナルな画面の Args composition

この方法で画面を構築する場合、複合コンポーネントの入力は、そのコンポーネントがレンダリングするさまざまなサブコンポーネントの入力を組み合わせたものになるのが一般的です。たとえば、画面がページレイアウト（現在のユーザーの詳細を含む）、ヘッダー（閲覧中のドキュメントを説明する）、リスト（サブドキュメントを表示する）をレンダリングする場合、その画面の入力はユーザー、ドキュメント、サブドキュメントで構成されることがあります。

```tsx
// YourPage.ts|tsx

export interface DocumentScreenProps {
  user?: {};
  document?: Document;
  subdocuments?: SubDocuments[];
}

export function DocumentScreen({ user, document, subdocuments }: DocumentScreenProps) {
  return (
    
      
      
    
  );
}
```

このような場合、サブコンポーネントの Story をもとにページの Story を構築するために、[args composition](https://storybook.js.org/docs/writing-stories/args.md#args-composition) を使うのが自然です。

```ts
// YourPage.stories.ts|tsx — CSF 3
// your-framework を使用しているフレームワークに置き換えてください。例: react-vite、nextjs、vue3-vite など。

// 👇 必要な Story を import します

const meta = {
  component: DocumentScreen,
} satisfies Meta<typeof DocumentScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  args: {
    user: PageLayout.Simple.args.user,
    document: DocumentHeader.Simple.args.document,
    subdocuments: DocumentList.Simple.args.documents,
  },
};
```

```ts
// YourPage.stories.ts|tsx — CSF Next 🧪

// 👇 必要な Story を import します

const meta = preview.meta({
  component: DocumentScreen,
});

export const Simple = meta.story({
  args: {
    user: PageLayout.Simple.input.args.user,
    document: DocumentHeader.Simple.input.args.document,
    subdocuments: DocumentList.Simple.input.args.documents,
  },
});
```

このアプローチは、各サブコンポーネントが複雑で多様な Story を公開している場合に有効です。繰り返しを避けながら、画面レベルの Story に現実的なシナリオを選んで組み立てられます。データを再利用し、Don't-Repeat-Yourself（DRY）の考え方を取ることで、Story のメンテナンス負担を最小限にできます。

## 接続されたコンポーネントをモックする

接続されたコンポーネントとは、外部データやサービスに依存するコンポーネントです。たとえば、ページ全体のコンポーネントは接続されたコンポーネントであることがよくあります。接続されたコンポーネントを Storybook でレンダリングするときは、そのコンポーネントが依存するデータやモジュールをモックする必要があります。モックできる層はいくつかあります。

### [import をモックする](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-modules.md)

コンポーネントは、コンポーネントファイルに import されたモジュールに依存することがあります。それらは外部パッケージの場合もあれば、プロジェクト内部のものの場合もあります。そのようなコンポーネントを Storybook でレンダリングしたりテストしたりするとき、挙動を制御するためにそれらのモジュールをモックしたいことがあります。

### [API サービスをモックする](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-network-requests.md)

ネットワークリクエストを行うコンポーネント（例: REST API や GraphQL API からのデータ取得）では、Story の中でそれらのリクエストをモックできます。

### [Provider をモックする](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-providers.md)

コンポーネントは Context Provider からデータや設定を受け取ることがあります。たとえば、styled component が ThemeProvider からテーマにアクセスしたり、Redux が React Context を使ってコンポーネントへアプリのデータアクセスを提供したりします。Provider とそれが提供する値をモックし、Story の中でコンポーネントをその Provider でラップできます。

### 依存関係のモックを避ける

接続された「コンテナー」コンポーネントの依存関係は、props や React Context 経由で受け渡しすることで、完全にモックを避けることも可能です。ただし、そのためにはコンテナーとプレゼンテーショナルコンポーネントのロジックを厳密に分離する必要があります。たとえば、データ取得ロジックと DOM のレンダリングをどちらも担当するコンポーネントがある場合は、前述のようにモックする必要があります。

プレゼンテーショナルコンポーネントの中にコンテナーコンポーネントを import して埋め込むことは一般的です。しかし先ほど見たように、それらを Storybook 内でレンダリングするには、依存関係や import をモックする必要がある可能性が高くなります。

これはすぐに退屈な作業になりやすいだけでなく、ローカル state を使うコンテナーコンポーネントのモックは難しくもあります。そこで、コンテナーを直接 import する代わりに、コンテナーコンポーネントを提供する React Context を作成する方法があります。これにより、コンポーネント階層のどのレベルでも通常どおりコンテナーコンポーネントを自由に埋め込めます。その後の依存関係のモックを気にする必要はありません。コンテナー自体を、モックしたプレゼンテーショナルな対応コンポーネントに差し替えられるためです。

アプリ内の特定のページやビューごとに Context コンテナーを分割することをおすすめします。たとえば `ProfilePage` コンポーネントがある場合、次のようなファイル構成にできます。

```
ProfilePage.js
ProfilePage.stories.js
ProfilePageContainer.js
ProfilePageContext.js
```

また、アプリのすべてのページでレンダリングされる可能性があるコンテナーコンポーネントのために、「グローバル」なコンテナー Context（たとえば `GlobalContainerContext` という名前）を用意し、アプリケーションの最上位に追加しておくと便利なことがよくあります。このグローバル Context にすべてのコンテナーを置くことも可能ですが、提供するのはグローバルに必要なコンテナーだけにするべきです。

このアプローチの実装例を見てみましょう。

まず React Context を作成し、`ProfilePageContext` という名前を付けます。これは React Context を export するだけです。

```js
// ProfilePageContext.js|jsx

const ProfilePageContext = createContext();

export default ProfilePageContext;
```

`ProfilePage` はプレゼンテーショナルコンポーネントです。`useContext` フックを使って、`ProfilePageContext` からコンテナーコンポーネントを取得します。

```js
// ProfilePage.js|jsx

export const ProfilePage = ({ name, userId }) => {
  const { UserPostsContainer, UserFriendsContainer } = useContext(ProfilePageContext);

  return (
    <div>
      <h1>{name}</h1>
      
      
    </div>
  );
};
```

#### Storybook でコンテナーをモックする

Storybook の文脈では、Context を通じてコンテナーコンポーネントを提供する代わりに、モックした対応コンポーネントを提供します。多くの場合、これらのモック版コンポーネントは、関連する Story からそのまま流用できます。

```js
// ProfilePage.stories.js|jsx

//👇 Story ファイルから特定の Story を import します

export default {
  component: ProfilePage,
};

const ProfilePageProps = {
  name: 'Jimi Hendrix',
  userId: '1',
};

const context = {
  //👇 必要であれば、ここで `userId` prop にアクセスできます:
  UserPostsContainer({ userId }) {
    return ;
  },
  // ほとんどの場合は単純に Story を渡せます。
  // この例では `UserFriends` コンポーネントの Story から
  // `normal` Story export を渡しています。
  UserFriendsContainer: UserFriendsNormal,
};

export const Normal = {
  render: () => (
    <ProfilePageContext.Provider value={context}>
      
    </ProfilePageContext.Provider>
  ),
};
```

同じ Context がすべての `ProfilePage` Story に適用される場合は、[decorator](https://storybook.js.org/docs/writing-stories/decorators.md) を使えます。

#### アプリケーションにコンテナーを提供する

次に、アプリケーションの文脈では、`ProfilePageContext.Provider` でラップして、`ProfilePage` が必要とするすべてのコンテナーコンポーネントを提供する必要があります。

たとえば Next.js では、これは `pages/profile.js` コンポーネントになります。

```js
// pages/profile.js|jsx

//👇 Context の値が各 render 間で参照的に等しいままになるようにしてください。
const context = {
  UserPostsContainer,
  UserFriendsContainer,
};

export const AppProfilePage = () => {
  return (
    <ProfilePageContext.Provider value={context}>
      
    </ProfilePageContext.Provider>
  );
};
```

#### Storybook でグローバルコンテナーをモックする

`GlobalContainerContext` を設定している場合は、すべての Story に Context を提供するために、Storybook の `preview.js` 内で decorator を設定する必要があります。例:

```tsx
// .storybook/preview.ts|tsx — CSF 3

// your-framework を使用しているフレームワークに置き換えてください。例: react-vite、nextjs、nextjs-vite など。

const context = {
  NavigationContainer: NavigationNormal,
};

const AppDecorator = (storyFn) => {
  return (
    <GlobalContainerContext.Provider value={context}>{storyFn()}</GlobalContainerContext.Provider>
  );
};

const preview: Preview = {
  decorators: [AppDecorator],
};

export default preview;
```

```tsx
// .storybook/preview.tsx — CSF Next 🧪

// your-framework を使用しているフレームワークに置き換えてください（例: react-vite、nextjs、nextjs-vite）

const context = {
  NavigationContainer: NavigationNormal,
};

const AppDecorator = (storyFn) => {
  return (
    <GlobalContainerContext.Provider value={context}>{storyFn()}</GlobalContainerContext.Provider>
  );
};

export default definePreview({
  decorators: [AppDecorator],
});
```
