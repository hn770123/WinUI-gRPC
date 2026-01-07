# バックエンド (Node.js/TypeScript)

gRPCサーバーの実装です。

## 構成

- **言語**: TypeScript
- **ランタイム**: Node.js
- **フレームワーク**: @grpc/grpc-js
- **ストレージ**: インメモリ（実運用時はデータベース推奨）

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

## 環境変数

- `PORT`: gRPCサーバーのポート番号（デフォルト: 50051）
