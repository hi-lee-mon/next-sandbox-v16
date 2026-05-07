# ローカルDB環境セットアップガイド

新メンバー向けに、ローカル開発用 PostgreSQL 環境の構成内容と理由を解説します。

---

## 目次

1. [なぜ Docker を使うのか？](#1-なぜ-docker-を使うのか)
2. [全体アーキテクチャ](#2-全体アーキテクチャ)
3. [docker-compose.yml の詳細解説](#3-docker-composeyml-の詳細解説)
4. [環境変数](#4-環境変数)
5. [postgres.js クライアント（lib/db.ts）](#5-postgresjs-クライアントlibdbts)
6. [日常的な使い方](#6-日常的な使い方)
7. [pgAdmin：ビジュアル管理ツール](#7-pgadminビジュアル管理ツール)
8. [よくあるトラブルと解決策](#8-よくあるトラブルと解決策)

---

## 1. なぜ Docker を使うのか？

### 「自分のPCでは動く」問題

Docker を使わない場合、各開発者が自分のPCに直接 PostgreSQL をインストールする必要があります。これが以下の問題を引き起こします。

| 問題 | 具体例 |
|---|---|
| **バージョン不一致** | AさんはPostgreSQL 14、BさんはPostgreSQL 17 ─ 微妙なSQL挙動の差異が片方のPCだけで再現するバグを生む |
| **設定のズレ** | 誰かが数ヶ月前に `postgresql.conf` をいじって忘れる。その人の環境だけ静かに違う動きをする |
| **データ状態の不一致** | デバッグ中にテーブルを作ったり消したりした結果、チームが期待するDBの状態と乖離する |

### Docker が解決すること

Docker は、データベースをバージョン・設定・初期状態ごと**コンテナ**という隔離された実行単位にパッケージします。全員が同じイメージから同じコンテナを起動するため、「自分のPCでは動く」が原理的に起きません。

Docker イメージは「設定済みサーバーの読み取り専用スナップショット」、コンテナはそのスナップショットの起動インスタンスです。コンテナを捨てて新しく作り直すのが数秒で完了し、常にクリーンな状態に戻れます。

```
あなたのPC
├── Next.js 開発サーバー  （Node.js でネイティブ実行）
└── Docker Engine
    ├── postgres コンテナ   ← データベース本体
    └── pgadmin コンテナ    ← ブラウザ操作できるGUI管理ツール
```

---

## 2. 全体アーキテクチャ

```
┌─────────────────────────────────────────────────┐
│               docker-compose                     │
│                                                  │
│  ┌─────────────────┐    ┌─────────────────────┐  │
│  │    postgres      │    │      pgadmin        │  │
│  │  ポート 5432     │◄───│  ポート 5050 → 80   │  │
│  │  (PostgreSQL 18) │    │  (Web GUI)          │  │
│  └────────┬─────────┘    └─────────────────────┘  │
│           │                                        │
│  ┌────────▼─────────┐                             │
│  │  postgres_data   │  ← 名前付きボリューム        │
│  │  （あなたのディスク│    （コンテナ再起動後も     │
│  │    上に永続保存） │     データが残る）           │
│  └──────────────────┘                             │
└─────────────────────────────────────────────────┘

        ▲
        │  DATABASE_URL  (postgres://user:pass@localhost:5432/db)
        │
┌───────┴────────────────────────────────────────┐
│              Next.js（あなたのアプリ）           │
│                                                 │
│   Server Component / Server Action              │
│       └── lib/db.ts （postgres.js クライアント） │
└────────────────────────────────────────────────┘
```

**ポイント：**
- Next.js は Docker の**外**で動き、`localhost:5432` 経由でDBに接続します
- DBのデータはDockerが管理する**ボリューム**に保存されるため、コンテナを止めてもデータは消えません
- pgAdmin は Docker の内部ネットワークで postgres と通信するため、ホスト名に `localhost` ではなく `postgres`（サービス名）を使います

---

## 3. docker-compose.yml の詳細解説

Docker Compose は、複数コンテナの構成を1つのYAMLファイルで定義・起動するツールです。各行を解説します。

```yaml
services:
```
最上位のキーです。この下に定義するものがそれぞれ「サービス（= 1つのコンテナ）」になります。

---

### `postgres` サービス

```yaml
  postgres:
    image: postgres:18-alpine
```
- `image`：使用するDockerイメージ。`postgres:18-alpine` は Alpine Linux（最小構成のLinux）ベースの PostgreSQL 18 です。イメージサイズが小さくダウンロードが速い。

```yaml
    container_name: next-sandbox-postgres
```
- 起動するコンテナの人間が読める名前。`docker ps` や `docker logs` でコンテナを識別するときに使います。

```yaml
    restart: unless-stopped
```
- 再起動ポリシー。コンテナがクラッシュした場合、Dockerが自動で再起動します。`docker compose down` で意図的に止めた場合は再起動しません。開発中は常にDBを使える状態にしたいので、このポリシーが便利です。

```yaml
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-next_sandbox}
```
- コンテナに渡す環境変数。PostgreSQL の公式イメージは、**初回起動時**にこれらを読んでユーザー・パスワード・DBを作成します。
- `${VAR:-デフォルト値}` の構文は「ホスト環境に `VAR` があればその値を使い、なければデフォルト値を使う」という意味です。Docker Compose は `.env.local` を自動で読み込むため、あなたの `.env.local` の値が自動的に反映されます。

```yaml
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
```
- ポートのマッピングです。書式は `"ホスト側ポート:コンテナ内ポート"` です。コンテナ内の 5432 番ポートをあなたのPC上の 5432 番で公開します。Next.js はこの `localhost:5432` に接続します。

```yaml
    volumes:
      - postgres_data:/var/lib/postgresql/data
```
- **名前付きボリューム**を PostgreSQL のデータ保存先にマウントします。これがなければ、コンテナを再起動するたびにすべてのデータが消えます。名前付きボリュームは Docker が管理し、`docker compose down` だけでは削除されません。完全に削除するには `docker compose down -v` が必要です。

```yaml
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
```
- Docker が定期的に `pg_isready`（PostgreSQLに付属する接続確認コマンド）を実行し、DBが本当に接続を受け付けられる状態かチェックします。この結果が `pgadmin` サービスの起動タイミングの判断に使われます。

**【補足】`test` コマンドの成否は終了コードで判定する**

`test` コマンドの結果は true/false ではなく、**終了コード（exit code）** で判定されます。これは Linux/Unix のコマンドライン全般の共通ルールです。

| 終了コード | 意味 | Docker Engine の判定 |
|---|---|---|
| `0` | 成功 | healthy ✅ |
| `1` 以上 | 失敗 | unhealthy / starting ❌ |

`pg_isready` も PostgreSQL 固有の仕組みではなく、このルールに従って「接続できたら exit 0、できなければ exit 1」を返しています。

**【補足】`CMD-SHELL` とは何か**

`test` の書き方には2種類あります。

| 形式 | 実行方法 | シェルの機能 |
|---|---|---|
| `["CMD", "pg_isready", "-U", "postgres"]` | コマンドを直接実行 | 使えない |
| `["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]` | シェル経由で実行 | 使える |

`CMD-SHELL` は内部的に `/bin/sh -c "..."` として展開されます。今回 `CMD-SHELL` を使っているのは、`${POSTGRES_USER:-postgres}`（変数が未定義ならデフォルト値を使う）がシェルの機能だからです。`CMD`（直接実行）ではシェルを通らないためこの展開が行われず、文字列がそのままコマンドに渡されてしまいます。シェルの変数展開・パイプ（`|`）・論理演算子（`&&`）などを使いたい場合は `CMD-SHELL`、単純なコマンドだけなら `CMD` という使い分けです。

**【補足】プロセスとは何か**

プロセスとは、OS がプログラムをメモリ（RAM）に展開し、CPU が実行している状態のことです。`docker compose up` を実行すると、Docker は postgres コンテナのプロセスを起動します。なお、PostgreSQL の実行ファイル自体はイメージ取得時（初回の `docker compose up` など）に既にダウンロード済みで、起動のたびにダウンロードされるわけではありません。

**【補足】なぜ `pg_isready` が必要か**

「コンテナのプロセスが起動した」と「PostgreSQL が接続を受け付けられる」は別のタイミングです。

```
docker compose up を実行
        │
        ▼
postgres プロセスが起動  ← Docker はここを「起動完了」と見なす
        │
        │  （この間、PostgreSQL は初期化処理中）
        │  ・データディレクトリのセットアップ
        │  ・ユーザー・パスワード・DBの作成
        │
        ▼
PostgreSQL が接続を受け付け始める  ← 実際に使えるのはここから
```

`pg_isready` がない場合、Docker は「プロセスが起動した」時点で pgAdmin を立ち上げてしまいます。しかし PostgreSQL はまだ初期化中のため、pgAdmin の接続が失敗してエラーで落ちることがあります。`pg_isready` を使うことで「実際に接続できる」状態になるまで pgAdmin の起動を待たせることができます。

---

### `pgadmin` サービス

```yaml
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: next-sandbox-pgadmin
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
```
- `depends_on` の `condition: service_healthy` は「postgres の healthcheck が成功するまで pgAdmin を起動しない」という指示です。`pg_isready` が成功を返した（= PostgreSQL が接続を受け付けられる状態になった）ことを確認してから pgAdmin を起動します。

**【補足】`service_healthy` はどこから来てどこで判定するのか**

`service_healthy` は Docker Compose が仕様として最初から用意している組み込みキーワードです。自分のコードで定義するものではありません。`depends_on` の `condition` には以下の3択があります：

| 値 | 意味 |
|---|---|
| `service_started` | コンテナのプロセスが起動した（デフォルト） |
| `service_healthy` | コンテナの `healthcheck` が成功した |
| `service_completed_successfully` | コンテナが正常終了（終了コード0）した |

判定は **Docker Engine**（Docker の本体デーモン）が行っています。Docker Engine が `healthcheck` の設定を読んで定期的に `pg_isready` を実行し、成功するとそのコンテナの状態を `healthy` に更新します。Docker Compose はその状態を監視して、`service_healthy` の条件が満たされた時点で pgAdmin の起動を開始します。つまり **`healthcheck` を定義した瞬間に `service_healthy` が使えるようになる**という関係です。

```yaml
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@example.com}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin}
    ports:
      - "5050:80"
```
- pgAdmin の Web インターフェースはコンテナ内の 80 番ポートで動き、あなたのPC上の 5050 番で公開されます。http://localhost:5050 でアクセスできます。

---

### ボリューム定義

```yaml
volumes:
  postgres_data:
  pgadmin_data:
```
- トップレベルで宣言することで、Docker Compose にこれらのボリュームを作成・管理させます。`postgres_data` にはDBの実データが、`pgadmin_data` には pgAdmin の設定（登録サーバー情報・クエリ履歴など）が保存されます。後者があることで、コンテナを再起動しても pgAdmin の設定を再入力する必要がありません。

---

## 4. 環境変数

### なぜ環境変数を使うのか

パスワードなどの認証情報をソースコードに直書きすることは重大なセキュリティリスクです。git の履歴に残り、リポジトリにアクセスできる全員に見え、リポジトリが公開された場合には世界中に漏洩します。

そこで、git が無視するファイルに機密情報を分離します。

### ファイルの役割分担

| ファイル | git管理 | 役割 |
|---|---|---|
| `.env.example` | **コミットする** | 必要な変数の一覧テンプレート。サンプル値のみなので安全 |
| `.env.local` | **コミットしない** | 実際の認証情報。`.gitignore` の `.env*` で除外済み |

### 新メンバーのセットアップ手順

```bash
cp .env.example .env.local
# .env.local を開いて各値を自分の環境に合わせて編集する
```

### 各変数の意味

```bash
# PostgreSQL のスーパーユーザー名
POSTGRES_USER=postgres

# スーパーユーザーのパスワード（共有環境では強力なものに変更すること）
POSTGRES_PASSWORD=postgres

# 初回起動時に作成されるデータベース名
POSTGRES_DB=next_sandbox

# PostgreSQL を公開するホスト側のポート番号
POSTGRES_PORT=5432

# アプリが使う接続文字列
# 書式: postgres://ユーザー名:パスワード@ホスト:ポート/DB名
DATABASE_URL=postgres://postgres:postgres@localhost:5432/next_sandbox

# pgAdmin のログイン情報
PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=admin
```

> **補足：** Docker Compose は自動的に `.env` ファイルを読み込みます。Next.js では `.env.local` がローカル開発用の標準的な機密ファイルです。

---

## 5. postgres.js クライアント（lib/db.ts）

### なぜ ORM ではなく postgres.js を選ぶのか

ORM（Prisma・Drizzle など）は SQL の上に抽象レイヤーを追加し、TypeScript でクエリを書くと SQL に変換してくれます。

今回 **postgres.js**（生SQLクライアント）を選んだ理由は：
- **透明性が高い**：書いたものがそのままDBに送られるため、デバッグしやすい
- **SQLの全機能を使える**：複雑なクエリで抽象レイヤーと戦う必要がない
- **軽量**：スキーマファイル・マイグレーションランナー・型生成などが不要

トレードオフは、SQLを手書きする必要があることです。ここではそれを意図的な選択としています。

### ファイルの内容

```ts
// lib/db.ts

import "server-only";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

export default sql;
```

#### 1行ずつ解説

**`import "server-only";`**

Next.js のセーフガードです。このファイルをクライアント側のコード（`"use client"` コンポーネントなど）がインポートしようとすると、ビルド時に以下のエラーが発生します：

```
Error: This module cannot be imported from a Client Component module.
```

これにより、`DATABASE_URL` などのDB接続情報がクライアント向けの JavaScript バンドルに誤って混入することを防ぎます。

**`const sql = postgres(process.env.DATABASE_URL!, ...)`**

接続**プール**を作成します。単一の接続ではなく、複数の接続を使い回す仕組みです。`!`（非nullアサーション）はTypeScriptに「この変数は必ず定義されている」と伝えます。`DATABASE_URL` が未設定の場合、postgres.js が起動時に明確なエラーを投げます。

**`idle_timeout: 20`**

20秒間使われていない接続はプールから切断・削除されます。開発中はリクエストが少ない時間帯もあるため、使われない接続が蓄積するのを防ぎます。

**`max_lifetime: 60 * 30`**

個々の接続は、使用中であっても30分経過したら強制切断されます。長時間の接続でサーバー側に状態が蓄積されたり、予期しない挙動が起きるのを防ぐための安全策です。

**なぜモジュールレベルでシングルトンにするのか**

Next.js の開発モード（HMR：ホットモジュールリプレース）では、ファイル変更のたびにモジュールが再インポートされることがあります。もし毎回 `postgres()` を呼んで新しいプールを作ると、DBの接続数上限をすぐに超えてしまいます。モジュールレベルで1つの `sql` インスタンスを作って export することで、Node.js のモジュールキャッシュが再利用を保証します。

---

## 6. 日常的な使い方

### DBを起動する

```bash
# postgres と pgadmin を両方バックグラウンドで起動（-d = detach）
docker compose up -d

# コンテナの状態を確認する
docker compose ps

# postgres のログをリアルタイムで確認する（初期化が正常に完了したかの確認に便利）
docker compose logs -f postgres
```

### DBを停止する

```bash
# コンテナを止める（データボリュームはそのまま残る）
docker compose down

# コンテナを止めてデータボリュームも全部削除する（完全リセット ─ すべての行が消える）
docker compose down -v
```

### ボリュームのデータを確認する

#### ボリュームはどこに保存されているか

名前付きボリュームのデータはローカルストレージ（HDD/SSD）に保存されますが、OS によって保存場所が異なります。

**Linux の場合**、Docker がホストのファイルシステムに直接保存します：
```
/var/lib/docker/volumes/next-sandbox-postgres_postgres_data/_data/
```

**macOS の場合（今回の環境）**、Docker Desktop は Linux 仮想マシン（VM）の上で動くため、ボリュームは VM の仮想ディスク内に保存されます。macOS の Finder からは直接見えません：
```
あなたのMac（macOS）
└── Docker Desktop が管理する Linux VM
    └── /var/lib/docker/volumes/...  ← ここに保存（Finderでは見えない）
```

#### ボリュームの情報を確認する

```bash
# ボリュームの詳細（保存先パスや作成日時）を表示する
docker volume inspect next-sandbox-postgres_postgres_data
```

#### ボリュームの中身をコマンドラインから確認する

macOS でも、一時的なコンテナ経由でボリュームの中身を確認できます：

```bash
# ファイル一覧を表示する
docker run --rm \
  -v next-sandbox-postgres_postgres_data:/data \
  alpine ls /data

# psql でDBに直接接続して SQL を実行する
docker exec -it next-sandbox-postgres \
  psql -U postgres -d next_sandbox
```

#### 操作別のデータ保持状況

| 操作 | データへの影響 |
|---|---|
| `docker compose down` | 残る ✅ |
| `docker compose down -v` | 消える ❌（完全リセット） |
| PC を再起動 | 残る ✅ |
| Docker Desktop をアンインストール | 消える ❌ |

通常の停止は常に `docker compose down`（`-v` なし）を使うこと。`-v` は「DBを完全にリセットしたい」ときだけ使う。

---

### Next.js のコードで DB クライアントを使う

`sql` タグ付きテンプレートリテラルはパラメータを自動でエスケープするため、SQLインジェクションを防ぎます。

```ts
// app/some-page/page.tsx  （Server Component）
import sql from "@/lib/db";

export default async function Page() {
  // 基本的なクエリ
  const users = await sql`SELECT id, name FROM users`;

  // パラメータ付きクエリ ─ 値は安全にエスケープされる（文字列結合ではない）
  const userId = 42;
  const [user] = await sql`SELECT * FROM users WHERE id = ${userId}`;

  return <div>{user.name}</div>;
}
```

```ts
// app/actions.ts  （Server Action）
"use server";
import sql from "@/lib/db";

export async function createUser(name: string, email: string) {
  const [user] = await sql`
    INSERT INTO users (name, email)
    VALUES (${name}, ${email})
    RETURNING id, name, email
  `;
  return user;
}
```

> **重要：** `` sql`WHERE id = ${someVar}` `` は安全です。postgres.js がパラメータ化してエスケープするためです。しかし `` `WHERE id = ` + someVar `` という文字列結合は SQLインジェクションの脆弱性になります。タグ付きテンプレートの構文は、安全な書き方が自然な書き方になるよう設計されています。

---

## 7. pgAdmin：ビジュアル管理ツール

pgAdmin は PostgreSQL のブラウザベースの GUI です。テーブルの閲覧、クエリの実行、データの確認をターミナルの SQL なしで行えます。

### pgAdmin にアクセスする

1. コンテナが起動していることを確認：`docker compose up -d`
2. ブラウザで http://localhost:5050 を開く
3. ログイン：
   - **メール**：`.env.local` の `PGADMIN_EMAIL` の値（デフォルト：`admin@example.com`）
   - **パスワード**：`PGADMIN_PASSWORD` の値（デフォルト：`admin`）

### pgAdmin から PostgreSQL に接続する

初回ログイン時にサーバーの登録が必要です：

1. **「Add New Server」** をクリック（または左パネルの *Servers* を右クリック → *Register* → *Server*）
2. **General タブ**：Name に任意の名前を入力（例：`next-sandbox`）
3. **Connection タブ**：
   - Host: **`postgres`** ← `localhost` ではなくサービス名を使う
   - Port: `5432`
   - Database: `POSTGRES_DB` の値（デフォルト：`next_sandbox`）
   - Username: `POSTGRES_USER` の値（デフォルト：`postgres`）
   - Password: `POSTGRES_PASSWORD` の値（デフォルト：`postgres`）
4. **Save** をクリック

> **なぜ `postgres` で `localhost` ではないのか？**
> Docker の内部ネットワークでは、コンテナはサービス名でお互いを見つけます。pgAdmin は Docker の中にいるため、pgAdmin から見た `localhost` は pgAdmin コンテナ自身を指します。ホストのPCでも postgres コンテナでもありません。サービス名 `postgres` を使うと、Docker の内部ネットワークで postgres コンテナのIPに解決されます。

---

## 8. よくあるトラブルと解決策

### 「Connection refused」エラー

**症状：** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**原因：** コンテナが起動していない。

**解決：** `docker compose up -d` を実行して数秒待つ。

---

### 「Password authentication failed」エラー

**症状：** `error: password authentication failed for user "postgres"`

**原因：** `DATABASE_URL` の認証情報が、PostgreSQL の初期化時に使った値と一致していない。

**重要な落とし穴：** PostgreSQL は `POSTGRES_USER`・`POSTGRES_PASSWORD`・`POSTGRES_DB` を**ボリュームが空の初回起動時だけ**読み込みます。ボリュームが既に存在する状態でこれらの変数を変更しても、DBは無視します。

**解決：** 元の認証情報に合わせて `DATABASE_URL` を修正するか、ボリュームを削除して再作成する：
```bash
docker compose down -v   # ボリューム削除（全データが消える）
docker compose up -d     # 新しい認証情報で初期化される
```

---

### pgAdmin が `localhost` に接続できない

**症状：** pgAdmin で「could not connect to server: Connection refused」と表示される（ホストを `localhost` にした場合）。

**解決：** ホスト名を `postgres`（Docker サービス名）に変更する。詳細はセクション 7 参照。

---

### `DATABASE_URL` が実行時に undefined になる

**症状：** `Error: Cannot read properties of undefined` や postgres.js の起動時エラー。

**原因：** `.env.local` がないか、`DATABASE_URL` が書かれていない。

**解決：** `.env.local` に `DATABASE_URL=postgres://...` が含まれているか確認する。`.env.local` を編集したら Next.js の開発サーバーを再起動すること（環境ファイルは起動時にのみ読み込まれる）。

---

### `docker compose down -v` でデータが消えた

**原因：** `-v` フラグは名前付きボリュームを削除します。意図してリセットするときは正しい動作ですが、うっかりつけると致命的です。

**予防：** 通常の停止は `docker compose down`（`-v` なし）を使う。`-v` は「DBを完全にリセットしたい」ときだけ使う。
