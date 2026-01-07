# WinUI-gRPC チャットアプリケーション

マルチユーザー対応のチャットアプリケーションです。WinUI 3とgRPCを使用して構築されています。

## 技術スタック

- **フロントエンド**: WinUI 3 / C#
- **バックエンド**: Node.js / TypeScript
- **通信**: gRPC
- **構成**: Monorepo

## プロジェクト構造

```
WinUI-gRPC/
├── packages/
│   ├── proto/          # gRPCプロトコル定義
│   │   └── protos/
│   │       ├── auth.proto      # 認証サービス
│   │       ├── channel.proto   # チャンネル管理サービス
│   │       ├── message.proto   # メッセージングサービス
│   │       └── user.proto      # ユーザー管理サービス
│   │
│   ├── backend/        # Node.js/TypeScript バックエンド
│   │   └── src/
│   │       ├── services/       # gRPCサービス実装
│   │       ├── storage.ts      # データストレージ
│   │       └── index.ts        # サーバーエントリーポイント
│   │
│   └── frontend/       # WinUI 3/C# フロントエンド
│       ├── Views/              # XAML画面
│       ├── ViewModels/         # ビューモデル
│       ├── Models/             # データモデル
│       ├── Services/           # gRPCクライアント
│       └── Converters/         # XAMLコンバーター
│
├── package.json        # ルートpackage.json
└── README.md
```

## 機能

### 画面構成

1. **ログイン画面**
   - ユーザー認証
   - 新規ユーザー登録

2. **チャンネル一覧＋メッセージ画面**
   - チャンネル一覧表示
   - メッセージ送受信
   - リアルタイムメッセージ更新（gRPCストリーミング）

3. **チャンネル編集画面**
   - 新規チャンネル作成
   - チャンネル削除
   - プライベートチャンネル設定

4. **ユーザー管理画面**
   - ユーザー一覧表示
   - ユーザー状態確認

### gRPCサービス

- **AuthService**: ログイン、ログアウト、ユーザー登録、トークン検証
- **ChannelService**: チャンネル作成、更新、削除、メンバー管理
- **MessageService**: メッセージ送信、取得、リアルタイムストリーミング
- **UserService**: ユーザー情報取得、更新、削除

## セットアップ

### 必要な環境

- Node.js 18.x以上
- .NET 8.0 SDK
- Windows 10/11 (WinUI 3用)

### インストール

1. リポジトリのクローン

```bash
git clone https://github.com/your-username/WinUI-gRPC.git
cd WinUI-gRPC
```

2. 依存パッケージのインストール

```bash
npm install
```

### バックエンドの起動

```bash
# 開発モード（ホットリロード有効）
npm run backend:dev

# ビルド＆実行
npm run backend:build
npm run backend:start
```

バックエンドサーバーはデフォルトで `localhost:50051` で起動します。

### デモユーザー

バックエンド起動時に以下のデモユーザーが自動作成されます:

- ユーザー1: `username=user1`, `password=password1`
- ユーザー2: `username=user2`, `password=password2`

### フロントエンドの起動

Visual Studio 2022を使用:

1. `packages/frontend/ChatApp.csproj` を開く
2. ビルド構成を選択（x64推奨）
3. F5キーでデバッグ実行

または、コマンドラインから:

```bash
cd packages/frontend
dotnet build
dotnet run
```

## 開発

### gRPCプロトコルの変更

`packages/proto/protos/*.proto` ファイルを編集後:

```bash
npm run proto:generate
```

これにより、Node.js用とC#用のコードが自動生成されます。

### バックエンド開発

- SQLiteデータベースでデータ永続化
- gRPCサービスは `packages/backend/src/services/` 配下に実装
- 各サービスはトークンベース認証を使用

### フロントエンド開発

- MVVM パターンを採用
- CommunityToolkit.Mvvm を使用
- gRPC通信は `GrpcClientService` を通じて実行
- リアルタイムメッセージングにgRPCストリーミングを使用

## テスト

### バックエンドテスト

バックエンドはJestを使用したユニットテストを含んでいます。

```bash
# すべてのテストを実行
cd packages/backend
npm test

# ウォッチモードで実行
npm run test:watch

# カバレッジレポート付きで実行
npm run test:coverage
```

**テスト内容:**
- 認証サービス (login, logout, register, validateToken)
- ユーザーサービス (CRUD操作)
- チャンネルサービス (作成、更新、削除、メンバー管理)
- メッセージサービス (送信、取得、削除)

**モック:**
- ストレージレイヤーをモック化
- bcryptjsによるパスワードハッシュ化のテスト

### フロントエンドテスト

フロントエンドはxUnitとMoqを使用したユニットテストを含んでいます。

```bash
# すべてのテストを実行
cd packages/frontend.tests
dotnet test

# カバレッジレポート付きで実行
dotnet test --collect:"XPlat Code Coverage"

# 詳細な出力で実行
dotnet test --logger "console;verbosity=detailed"
```

**テスト内容:**
- GrpcClientServiceの統合テスト
- LoginViewModelのプロパティテスト
- ChatViewModelのプロパティテスト

**注意:**
- 統合テストを実行する場合は、事前にバックエンドサーバーを起動してください
- ViewModelの完全なユニットテストには依存性注入の実装が推奨されます
- 詳細は `packages/frontend.tests/README.md` を参照してください

## セキュリティに関する注意

このプロジェクトはデモ/学習目的です。本番環境では以下を実装してください:

- 適切なユーザー認証（JWT、OAuth等）
- TLS/SSL通信
- データベースへの永続化
- 入力バリデーション強化
- レート制限
- ログ記録

## ライセンス

MIT
