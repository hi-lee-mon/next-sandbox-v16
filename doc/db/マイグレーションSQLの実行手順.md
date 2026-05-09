# マイグレーションSQLの実行手順

新しいテーブルを追加するとき、`migrations/` に SQL ファイルを置き、Docker 経由でDBに適用します。  
ここでは `blogs` テーブルを例に、一連の流れを解説します。

---

## 1. マイグレーションファイルの場所と役割

```
next-sandbox-v16/
└── migrations/
    ├── 001_create_blogs.sql                        ← テーブル作成
    └── 002_add_user_id_and_is_private_to_blogs.sql ← カラム追加
```

このプロジェクトは ORM（Prisma・Drizzle など）を使いません。テーブルの変更履歴を `migrations/` フォルダの SQL ファイルで管理します。

**命名規則：** `連番_説明.sql`（例：`001_create_blogs.sql`）  
連番を付けることで、どの順番で適用すべきかが一目でわかります。

---

## 2. テーブルを作成する SQL

```sql
-- migrations/001_create_blogs.sql

CREATE TABLE IF NOT EXISTS blogs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

### 各カラムの意味

| カラム | 型 | 説明 |
|---|---|---|
| `id` | UUID | 主キー。`gen_random_uuid()` で自動採番 |
| `title` | TEXT | 記事タイトル |
| `body` | TEXT | 記事本文 |
| `created_at` | TIMESTAMPTZ | 作成日時（タイムゾーン付き） |
| `updated_at` | TIMESTAMPTZ | 更新日時（タイムゾーン付き） |
| `deleted_at` | TIMESTAMPTZ | 削除日時。`NULL` = 存在する記事（論理削除用） |

### 設計のポイント

**UUID を使う理由**

`BIGSERIAL`（1, 2, 3…）のような連番IDは、外部から「次のIDは何か」が推測できてしまいます。UUID はランダムな値なので予測不能です。また、将来的に複数DBへの分散も考慮しやすくなります。

**TIMESTAMPTZ（タイムゾーン付き）を使う理由**

`TIMESTAMP`（タイムゾーンなし）はサーバーのローカル時刻をそのまま保存するため、環境によって意味が変わります。`TIMESTAMPTZ` はUTCで保存し、取り出し時にアプリ側のタイムゾーンに変換されるため、時刻が一意に定まります。

**`deleted_at` で論理削除する理由**

`DELETE` で物理削除するとデータが復元できません。`deleted_at` に日時を入れることで「削除済み」を表現し、元のデータを保持します。クエリでは `WHERE deleted_at IS NULL` を付けることで、生きているレコードだけを取得します。

---

## 3. カラムを追加する SQL

既存テーブルにカラムを追加するには `ALTER TABLE ... ADD COLUMN` を使います。

```sql
-- migrations/002_add_user_id_and_is_private_to_blogs.sql

ALTER TABLE blogs
  ADD COLUMN IF NOT EXISTS user_id    TEXT    REFERENCES "user"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;
```

### 各オプションの意味

| オプション | 意味 |
|---|---|
| `IF NOT EXISTS` | カラムがすでにある場合はスキップ（何度実行しても安全） |
| `REFERENCES "user"(id)` | better-auth の `user` テーブルの `id` への外部キー |
| `ON DELETE SET NULL` | ユーザーが削除されたとき `user_id` を NULL にする |
| `NOT NULL DEFAULT FALSE` | 必ず値を持ち、省略時は `false`（公開）になる |

既存ファイルを書き換えるのではなく、**常に新しいファイルで差分を表現する**のがマイグレーションの基本です。既存ファイルを変更すると「いつ・何を変えたか」の履歴が失われます。

---

## 4. マイグレーションを実行する

### コンテナが起動していることを確認

```bash
docker compose ps
```

`next-sandbox-postgres` の `STATUS` が `Up` または `healthy` なら OK です。

### 方法① Docker コンテナ内の psql を使う（推奨）

```bash
docker exec -i next-sandbox-postgres psql -U admin -d next_sandbox -f - < migrations/001_create_blogs.sql
```

コマンドの意味：

```
docker exec -i next-sandbox-postgres psql -U admin -d next_sandbox -f - < migrations/001_create_blogs.sql
│           │   │                     │    │       │               │  │
│           │   │                     │    │       │               │  └─ ホストのファイルを標準入力に流す
│           │   │                     │    │       │               └─── 標準入力からSQLを読む
│           │   │                     │    │       └─────────────────── 接続先DB名
│           │   │                     │    └─────────────────────────── 接続ユーザー名
│           │   │                     └──────────────────────────────── 実行コマンド
│           │   └────────────────────────────────────────────────────── コンテナ名
│           └────────────────────────────────────────────────────────── 標準入力を開いたまま保持
└────────────────────────────────────────────────────────────────────── 起動中コンテナ内でコマンド実行
```

**`-i` で `-t` を使わない理由**

ファイルをリダイレクトする場合（`< ファイル`）は、キーボード入力でなくファイルが標準入力になります。このとき `-t`（擬似ターミナル）を指定すると「ターミナルっぽい表示」を期待するのに入力がファイルだという矛盾が生まれ、エラーや文字化けの原因になります。ファイルを渡すときは `-i` だけで十分です。

正常に実行されると何も表示されません（エラーなし = 成功）。

### 方法② ホストの psql を使う

`.env` はNext.jsが自動で読み込むものであり、**シェル（ターミナル）は自動で読み込みません**。そのままでは `$DATABASE_URL` が空になってしまうため、`source` で事前に読み込む必要があります。

```
実行方法                    .env を読む主体        結果
pnpm dev / pnpm build  →  Next.js が自動で読む  → $DATABASE_URL が使える
ターミナルで直接          →  誰も読まない          → $DATABASE_URL = 空
```

`source` はシェルの組み込みコマンドで、ファイルの内容を現在のシェルセッションに読み込みます。一度実行すれば、そのターミナルのウィンドウ（タブ）を閉じるまで有効です。

```bash
# .env.local を読み込んでから psql を実行
source .env.local
psql "$DATABASE_URL" -f migrations/001_create_blogs.sql
```

---

## 5. テーブルが作成されたことを確認する

### コンテナに接続して確認する

```bash
docker exec -it next-sandbox-postgres psql -U admin -d next_sandbox
```

接続後、以下のコマンドを実行します：

```sql
-- テーブル一覧を表示
\dt

-- blogs テーブルの構造を確認
\d blogs

-- psql を終了
\q
```

`\d blogs` の出力例（カラム追加後）：

```
                        Table "public.blogs"
   Column   |           Type           | Nullable |      Default
------------+--------------------------+----------+-------------------
 id         | uuid                     | not null | gen_random_uuid()
 title      | text                     | not null |
 body       | text                     | not null |
 created_at | timestamp with time zone | not null | now()
 updated_at | timestamp with time zone | not null | now()
 deleted_at | timestamp with time zone |          |
 user_id    | text                     |          |
 is_private | boolean                  | not null | false
Indexes:
    "blogs_pkey" PRIMARY KEY, btree (id)
```

---

## 6. Next.js からテーブルを使う

テーブルの作成後は `app/(default)/blogs/_data/blog.ts` で定義済みの関数からアクセスできます。

```ts
// Server Component での使い方
import { getBlogs } from "@/app/(default)/blogs/_data/blog";

export default async function BlogListPage() {
  const blogs = await getBlogs(); // 公開記事 + 自分の非公開記事のみ取得

  return (
    <ul>
      {blogs.map((blog) => (
        <li key={blog.id}>{blog.title}</li>
      ))}
    </ul>
  );
}
```

```ts
// 型定義（blog.ts から import 可能）
type Blog = {
  id: string;
  title: string;
  body: string;
  user_id: string | null;
  is_private: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};
```

新しいクエリを追加したい場合は `app/(default)/blogs/_data/blog.ts` に関数を追記します。
