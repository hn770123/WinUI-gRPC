# バックエンド (Node.js/TypeScript)

gRPCサーバーの実装です。

## 構成

- **言語**: TypeScript
- **ランタイム**: Node.js
- **フレームワーク**: @grpc/grpc-js
- **ストレージ**: SQLite (better-sqlite3)
- **データベース**: `packages/backend/data/chat.db`

## サービス

### AuthService (auth.proto)
- `Login`: ユーザーログイン
- `Logout`: ユーザーログアウト
- `ValidateToken`: トークン検証
- `Register`: 新規ユーザー登録

### ChannelService (channel.proto)
- `CreateChannel`: チャンネル作成
- `ListChannels`: チャンネル一覧取得
- `GetChannel`: チャンネル詳細取得
- `UpdateChannel`: チャンネル更新
- `DeleteChannel`: チャンネル削除
- `AddChannelMember`: メンバー追加
- `RemoveChannelMember`: メンバー削除

### MessageService (message.proto)
- `SendMessage`: メッセージ送信
- `ListMessages`: メッセージ一覧取得
- `SubscribeMessages`: メッセージストリーミング購読
- `DeleteMessage`: メッセージ削除

### UserService (user.proto)
- `ListUsers`: ユーザー一覧取得
- `GetUser`: ユーザー詳細取得
- `UpdateUser`: ユーザー更新
- `DeleteUser`: ユーザー削除
- `SetUserActive`: ユーザー状態変更

## 起動方法

```bash
# 開発モード
npm run dev

# ビルド
npm run build

# 本番実行
npm start
```

## データベース

このバックエンドはSQLiteを使用してデータを永続化します。

### スキーマ

- **users**: ユーザー情報
- **sessions**: ログインセッション
- **channels**: チャンネル情報
- **channel_members**: チャンネルメンバーの関連テーブル
- **messages**: メッセージ

### 初期化

サーバー起動時に以下が自動的に実行されます:
1. データベーススキーマの作成（存在しない場合）
2. デモユーザーとチャンネルの作成（初回のみ）

### デモデータ

- **ユーザー1**: username=`user1`, password=`password1`
- **ユーザー2**: username=`user2`, password=`password2`
- **チャンネル**: 一般（両ユーザーが所属）

### データベースファイル

- データベースファイルは `packages/backend/data/chat.db` に保存されます
- WALモード（Write-Ahead Logging）が有効化されています
- `.gitignore` でデータベースファイルは除外されています

## 環境変数

- `PORT`: gRPCサーバーのポート番号（デフォルト: 50051）
