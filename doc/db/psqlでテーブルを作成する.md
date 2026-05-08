# psql でテーブルを作成する

## psql とは

PostgreSQL に付属するコマンドラインツールです。SQL をターミナルから直接実行できます。  
GUI ツール（pgAdmin）が不要なため、素早く操作したいときに便利です。

---

## 1. コンテナに接続する

```bash
docker exec -it next-sandbox-postgres psql -U postgres -d next_sandbox
```

コマンドの意味：

```
docker exec -it next-sandbox-postgres psql -U postgres -d next_sandbox
│           │   │                     │    │           │
│           │   │                     │    │           └─ 接続先のDB名（-d = database）
│           │   │                     │    └─────────── 接続ユーザー名（-U = user）
│           │   │                     └──────────────── 実行するコマンド（psql）
│           │   └────────────────────────────────────── コンテナ名
│           └────────────────────────────────────────── インタラクティブ操作を可能にするオプション
└────────────────────────────────────────────────────── 起動中コンテナの中でコマンドを実行する
```

**`-it` の補足：**

| オプション | 意味 |
|---|---|
| `-i` | 標準入力を開いたまま保持（キーボード入力を受け付ける） |
| `-t` | 擬似ターミナルを割り当てる（普通のターミナルっぽく表示する） |

接続すると以下のプロンプトが表示されます：

```
next_sandbox=#
```

---

## 2. テーブルを作成する

プロンプトに SQL を入力して `Enter` を押すと実行されます。

```sql
CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. 確認コマンド

| コマンド | 説明 |
|---|---|
| `\dt` | テーブル一覧を表示 |
| `\d users` | `users` テーブルの構造を表示 |
| `SELECT * FROM users;` | データを確認 |

---

## 4. psql を終了する

```sql
\q
```

---

## 5. Next.js からテーブルを使う

テーブルを作成したあとは、[lib/db.ts](../../lib/db.ts) の `sql` クライアントを使ってアクセスします。

```ts
// Server Component からデータを取得する
const users = await sql`SELECT id, name FROM users`;

// Server Action からデータを挿入する
const [user] = await sql`
  INSERT INTO users (name, email)
  VALUES (${name}, ${email})
  RETURNING id, name, email
`;
```

> **重要：** `${変数}` はテンプレートリテラルの構文で、postgres.js が自動的にパラメータ化してエスケープします。文字列結合（`"WHERE id = " + id`）は SQL インジェクションの脆弱性になるため使わないこと。
