# Docker コンテナ起動エラーの調査・解決手順

> 対象: 新人エンジニア向け
> 事例: `next-sandbox-postgres` コンテナが unhealthy になり起動に失敗したケース

---

## 1. エラーの発生

`docker compose up -d` を実行したところ、以下のエラーメッセージが表示されました。

```
dependency failed to start: container next-sandbox-postgres is unhealthy
```

このメッセージは「依存関係のコンテナが正常に起動しなかった」ことを意味します。
今回は `pgadmin` が `postgres` の起動完了を待っていたが、`postgres` が unhealthy だったため連鎖的に失敗しました。

---

## 2. 調査手順

### ステップ① コンテナの状態を確認する

まず全コンテナの状態を一覧で確認します。

```bash
docker ps -a --filter "name=next-sandbox"
```

**出力例:**

```
CONTAINER ID   IMAGE                   STATUS                         NAMES
8f125c5ed8da   dpage/pgadmin4:latest   Created                        next-sandbox-pgadmin
7f5eb296bf89   postgres:18-alpine      Restarting (1) 5 seconds ago   next-sandbox-postgres
```

**ポイント:**
- `Restarting` = コンテナが起動しては落ちるループ状態
- `Created` = 依存先が起動しなかったため待機中

### ステップ② docker-compose.yml を確認する

設定ファイルを見て、コンテナ間の依存関係やボリューム設定を把握します。

```yaml
services:
  postgres:
    image: postgres:18-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data  # ← ここが重要
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]

  pgadmin:
    depends_on:
      postgres:
        condition: service_healthy  # ← postgres が healthy になるまで待つ
```

`depends_on` + `condition: service_healthy` の組み合わせにより、`postgres` のヘルスチェックが通らないと `pgadmin` も起動しない設定になっています。

### ステップ③ 問題コンテナのログを確認する

エラーの根本原因はログに出ています。

```bash
docker logs next-sandbox-postgres
```

**出力された重要なメッセージ:**

```
Error: in 18+, these Docker images are configured to store database data in a
       format which is compatible with "pg_ctlcluster" (specifically, using
       major-version-specific directory names).

       Counter to that, there appears to be PostgreSQL data in:
         /var/lib/postgresql/data (unused mount/volume)

       The suggested container configuration for 18+ is to place a single mount
       at /var/lib/postgresql which will then place PostgreSQL data in a
       subdirectory, allowing usage of "pg_upgrade --link" without mount point
       boundary issues.
```

---

## 3. 原因の特定

**原因: PostgreSQL 18 のデータ保存仕様変更**

| バージョン | データパス |
|---|---|
| PostgreSQL 17 以前 | `/var/lib/postgresql/data` |
| PostgreSQL 18 以降 | `/var/lib/postgresql/18/main/`（`/var/lib/postgresql` 配下のサブディレクトリ） |

既存のボリュームは旧形式（`/var/lib/postgresql/data`）でデータが書き込まれていたため、
PostgreSQL 18 がマウントポイントの不整合を検出して起動を拒否していました。

```
古いボリュームのマウント先: /var/lib/postgresql/data  ← PostgreSQL 18 は認識できない
新しい推奨マウント先:       /var/lib/postgresql       ← ここにマウントすると /18/main/ を作成
```

---

## 4. 解決策と対応内容

### docker-compose.yml のマウントパスを変更

```diff
 services:
   postgres:
     image: postgres:18-alpine
     volumes:
-      - postgres_data:/var/lib/postgresql/data
+      - postgres_data:/var/lib/postgresql
```

### 古いボリュームを削除して再起動

旧形式のデータが残っていると再度エラーになるため、`-v` オプションでボリュームごと削除します。

```bash
docker compose down -v && docker compose up -d
```

> **注意:** `-v` を付けるとボリューム内のデータが削除されます。
> 本番環境では絶対に実行しないでください。開発環境でのみ使用します。

---

## 5. 再発防止のポイント

1. **Docker イメージのバージョンを上げる際は必ずリリースノートを確認する**
   - メジャーバージョンアップ（例: 17 → 18）は破壊的変更を含む場合がある

2. **`docker logs <container>` はトラブルシューティングの基本**
   - エラーメッセージに解決策が書かれていることが多い

3. **ヘルスチェックが失敗する場合はコンテナログを最初に見る**
   - `unhealthy` の原因はほぼ必ずログに出ている

---

## まとめ

```
エラー検知
  └─ docker ps -a でコンテナ状態を確認
       └─ Restarting を発見
            └─ docker logs でエラー内容を確認
                 └─ PostgreSQL 18 の仕様変更を特定
                      └─ docker-compose.yml のマウントパスを修正
                           └─ docker compose down -v && up -d で解決
```
