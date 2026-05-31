> **Version 10.4** — **React** / **TypeScript**
> ほかの形式も利用できます:
- Angular、Solid、Svelte、Vue、Web Components 向けは `?renderer=angular`
- JavaScript 向けは `?language=js`
- コードスニペットのみは `?codeOnly=true`
- ほかのバージョン: Version 9 (`/docs/9/writing-stories/mocking-data-and-modules/mocking-network-requests.md`)、Version 8 (`/docs/8/writing-stories/mocking-data-and-modules/mocking-network-requests.md`)

# ネットワークリクエストをモックする

ネットワークリクエストを行うコンポーネント、たとえば REST API や GraphQL API からデータを取得するコンポーネントでは、[Mock Service Worker (MSW)](https://mswjs.io/) のようなツールを使ってそれらのリクエストをモックできます。MSW は API モック用のライブラリで、サービスワーカーを使ってネットワークリクエストを捕捉し、レスポンスとしてモックデータを返します。

[MSW addon](https://storybook.js.org/addons/msw-storybook-addon/) はこの機能を Storybook に持ち込み、ストーリー内で API リクエストをモックできるようにします。以下では、このアドオンのセットアップ方法と使い方の概要を説明します。

## MSW addon をセットアップする

まず、必要に応じて次のコマンドを実行し、MSW と MSW addon をインストールします。

```sh
npm install msw msw-storybook-addon --save-dev
```

```sh
pnpm add msw msw-storybook-addon --save-dev
```

```sh
yarn add msw msw-storybook-addon --save-dev
```

まだ MSW を使っていない場合は、MSW の動作に必要なサービスワーカーファイルを生成します。

```shell
npx msw init public/
```

```shell
yarn dlx msw init public/
```

```shell
pnpm dlx msw init public/
```

次に、Storybook 設定の [`staticDirs`](https://storybook.js.org/docs/api/main-config/main-config-static-dirs.md) プロパティが、生成されたサービスワーカーファイルを含むようにします。デフォルトでは `/public` に生成されます。

```ts
// .storybook/main.ts — CSF 3
// your-framework を使用しているフレームワークに置き換えます。例: react-vite、nextjs、vue3-vite など。

const config: StorybookConfig = {
  framework: '@storybook/your-framework',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../public', '../static'],
};

export default config;
```

```ts
// .storybook/main.ts — CSF Next 🧪
// your-framework を使用しているフレームワークに置き換えます。例: react-vite、nextjs、nextjs-vite。

export default defineMain({
  framework: '@storybook/your-framework',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../public', '../static'],
});
```

最後に、アドオンを初期化し、[プロジェクトレベルのローダー](https://storybook.js.org/docs/writing-stories/loaders.md#global-loaders)で全ストーリーに適用します。

```ts
// .storybook/preview.ts|tsx — CSF 3
// your-framework を使用しているフレームワークに置き換えます。例: react-vite、nextjs、vue3-vite など。

/*
 * MSW を初期化します
 * カスタマイズ方法については
 * https://github.com/mswjs/msw-storybook-addon#configuring-msw
 * を参照してください
 */
initialize();

const preview: Preview = {
  loaders: [mswLoader], // 👈 すべてのストーリーに MSW ローダーを追加します
};

export default preview;
```

```ts
// .storybook/preview.tsx — CSF Next 🧪
// your-framework を使用しているフレームワークに置き換えます。例: react-vite、nextjs、nextjs-vite。

/*
 * MSW を初期化します
 * カスタマイズ方法については
 * https://github.com/mswjs/msw-storybook-addon#configuring-msw
 * を参照してください
 */
initialize();

export default definePreview({
  loaders: [mswLoader], // 👈 すべてのストーリーに MSW ローダーを追加します
});
```

## REST リクエストをモックする

コンポーネントが REST API からデータを取得する場合、MSW を使って Storybook 内でそれらのリクエストをモックできます。例として、次のドキュメント画面コンポーネントを考えます。

```ts
// YourPage.tsx

// 外部エンドポイントからデータを取得するサンプルフック
function useFetchData() {
  const [status, setStatus] = useState<string>('idle');
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    setStatus('loading');
    fetch('https://your-restful-endpoint')
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.statusText);
        }
        return res;
      })
      .then((res) => res.json())
      .then((data) => {
        setStatus('success');
        setData(data);
      })
      .catch(() => {
        setStatus('error');
      });
  }, []);

  return {
    status,
    data,
  };
}

export function DocumentScreen() {
  const { status, data } = useFetchData();

  const { user, document, subdocuments } = data;

  if (status === 'loading') {
    return <p>Loading...</p>;
  }
  if (status === 'error') {
    return <p>There was an error fetching the data!</p>;
  }
  return (
    
      
      
    
  );
}
```

この例では、ネットワークリクエストを行うために [`fetch` API](https://developer.mozilla.org/en-US/docs/Web/API/fetch) を使っています。別のライブラリ、たとえば [`axios`](https://axios-http.com/) を使っている場合でも、同じ考え方で Storybook 内のネットワークリクエストをモックできます。

MSW addon を使うと、MSW で REST リクエストをモックするストーリーを書けます。以下は、ドキュメント画面コンポーネントに対する 2 つのストーリーの例です。1 つはデータ取得が成功するケース、もう 1 つは失敗するケースです。

```ts
// YourPage.stories.ts|tsx — CSF 3
// your-framework を使用しているフレームワークに置き換えます。例: react-vite、nextjs、vue3-vite など。

const meta = {
  component: DocumentScreen,
} satisfies Meta<typeof DocumentScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

// 👇 ストーリーで使用するモックデータ
const TestData = {
  user: {
    userID: 1,
    name: 'Someone',
  },
  document: {
    id: 1,
    userID: 1,
    title: 'Something',
    brief: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    status: 'approved',
  },
  subdocuments: [
    {
      id: 1,
      userID: 1,
      title: 'Something',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      status: 'approved',
    },
  ],
};

export const MockedSuccess: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('https://your-restful-endpoint/', () => {
          return HttpResponse.json(TestData);
        }),
      ],
    },
  },
};

export const MockedError: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('https://your-restful-endpoint', async () => {
          await delay(800);
          return new HttpResponse(null, {
            status: 403,
          });
        }),
      ],
    },
  },
};
```

```ts
// YourPage.stories.ts|tsx — CSF Next 🧪

const meta = preview.meta({
  component: DocumentScreen,
});

// 👇 ストーリーで使用するモックデータ
const TestData = {
  user: {
    userID: 1,
    name: 'Someone',
  },
  document: {
    id: 1,
    userID: 1,
    title: 'Something',
    brief: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    status: 'approved',
  },
  subdocuments: [
    {
      id: 1,
      userID: 1,
      title: 'Something',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      status: 'approved',
    },
  ],
};

export const MockedSuccess = meta.story({
  parameters: {
    msw: {
      handlers: [
        http.get('https://your-restful-endpoint/', () => {
          return HttpResponse.json(TestData);
        }),
      ],
    },
  },
});

export const MockedError = meta.story({
  parameters: {
    msw: {
      handlers: [
        http.get('https://your-restful-endpoint', async () => {
          await delay(800);
          return new HttpResponse(null, {
            status: 403,
          });
        }),
      ],
    },
  },
});
```

## GraphQL リクエストをモックする

GraphQL も、コンポーネントでデータを取得する一般的な方法です。MSW を使うと、Storybook 内で GraphQL リクエストをモックできます。以下は、GraphQL API からデータを取得するドキュメント画面コンポーネントの例です。

```ts
// YourPage.tsx

const AllInfoQuery = gql`
  query AllInfo {
    user {
      userID
      name
    }
    document {
      id
      userID
      title
      brief
      status
    }
    subdocuments {
      id
      userID
      title
      content
      status
    }
  }
`;

interface Data {
  allInfo: {
    user: {
      userID: number;
      name: string;
      opening_crawl: boolean;
    };
    document: {
      id: number;
      userID: number;
      title: string;
      brief: string;
      status: string;
    };
    subdocuments: {
      id: number;
      userID: number;
      title: string;
      content: string;
      status: string;
    };
  };
}

function useFetchInfo() {
  const { loading, error, data } = useQuery<Data>(AllInfoQuery);

  return { loading, error, data };
}

export function DocumentScreen() {
  const { loading, error, data } = useFetchInfo();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>There was an error fetching the data!</p>;
  }

  return (
    
      
      
    
  );
}
```

この例では、[Apollo Client](https://www.apollographql.com/docs/) で GraphQL を使ってネットワークリクエストを行っています。別のライブラリ、たとえば [URQL](https://formidable.com/open-source/urql/) や [React Query](https://react-query.tanstack.com/) を使っている場合でも、同じ考え方で Storybook 内のネットワークリクエストをモックできます。

MSW addon を使うと、MSW で GraphQL リクエストをモックするストーリーを書けます。以下は、ドキュメント画面コンポーネントに対する 2 つのストーリーの例です。最初のストーリーはデータ取得が成功するケースで、2 つ目は失敗するケースです。

```tsx
// YourPage.stories.ts|tsx — CSF 3

// your-framework を使用しているフレームワークに置き換えます。例: react-vite、nextjs、nextjs-vite など。

const mockedClient = new ApolloClient({
  uri: 'https://your-graphql-endpoint',
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
});

//👇 ストーリーで使用するモックデータ
const TestData = {
  user: {
    userID: 1,
    name: 'Someone',
  },
  document: {
    id: 1,
    userID: 1,
    title: 'Something',
    brief: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    status: 'approved',
  },
  subdocuments: [
    {
      id: 1,
      userID: 1,
      title: 'Something',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      status: 'approved',
    },
  ],
};
const meta = {
  component: DocumentScreen,
  decorators: [
    (Story) => (
      
        
      
    ),
  ],
} satisfies Meta<typeof DocumentScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MockedSuccess: Story = {
  parameters: {
    msw: {
      handlers: [
        graphql.query('AllInfoQuery', () => {
          return HttpResponse.json({
            data: {
              allInfo: {
                ...TestData,
              },
            },
          });
        }),
      ],
    },
  },
};

export const MockedError: Story = {
  parameters: {
    msw: {
      handlers: [
        graphql.query('AllInfoQuery', async () => {
          await delay(800);
          return HttpResponse.json({
            errors: [
              {
                message: 'Access denied',
              },
            ],
          });
        }),
      ],
    },
  },
};
```

```tsx
// YourPage.stories.ts|tsx — CSF Next 🧪

const mockedClient = new ApolloClient({
  uri: 'https://your-graphql-endpoint',
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
});

//👇 ストーリーで使用するモックデータ
const TestData = {
  user: {
    userID: 1,
    name: 'Someone',
  },
  document: {
    id: 1,
    userID: 1,
    title: 'Something',
    brief: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    status: 'approved',
  },
  subdocuments: [
    {
      id: 1,
      userID: 1,
      title: 'Something',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      status: 'approved',
    },
  ],
};
const meta = preview.meta({
  component: DocumentScreen,
  decorators: [
    (Story) => (
      
        
      
    ),
  ],
});

export const MockedSuccess = meta.story({
  parameters: {
    msw: {
      handlers: [
        graphql.query('AllInfoQuery', () => {
          return HttpResponse.json({
            data: {
              allInfo: {
                ...TestData,
              },
            },
          });
        }),
      ],
    },
  },
});

export const MockedError = meta.story({
  parameters: {
    msw: {
      handlers: [
        graphql.query('AllInfoQuery', async () => {
          await delay(800);
          return HttpResponse.json({
            errors: [
              {
                message: 'Access denied',
              },
            ],
          });
        }),
      ],
    },
  },
});
```

## ストーリー向けに MSW を設定する

上記の例では、各ストーリーで `parameters.msw` を設定し、モックサーバーのリクエストハンドラーを定義している点に注目してください。このように parameters を使っているため、[コンポーネント](https://storybook.js.org/docs/writing-stories/parameters.md#component-parameters)レベルや[プロジェクト](https://storybook.js.org/docs/writing-stories/parameters.md#global-parameters)レベルでも設定できます。これにより、同じモックサーバー設定を複数のストーリーで共有できます。
