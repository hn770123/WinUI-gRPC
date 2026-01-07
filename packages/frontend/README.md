# フロントエンド (WinUI 3/C#)

WinUI 3で構築されたデスクトップチャットクライアントです。

## 構成

- **フレームワーク**: WinUI 3
- **言語**: C#
- **パターン**: MVVM
- **ライブラリ**:
  - CommunityToolkit.Mvvm
  - Grpc.Net.Client
  - Google.Protobuf

## プロジェクト構造

```
frontend/
├── Views/              # XAML画面
│   ├── LoginPage.xaml
│   ├── ChatPage.xaml
│   ├── ChannelEditPage.xaml
│   └── UserManagementPage.xaml
│
├── ViewModels/         # ビューモデル
│   ├── LoginViewModel.cs
│   ├── ChatViewModel.cs
│   ├── ChannelEditViewModel.cs
│   └── UserManagementViewModel.cs
│
├── Models/             # データモデル
│   ├── User.cs
│   ├── Channel.cs
│   └── Message.cs
│
├── Services/           # サービス層
│   └── GrpcClientService.cs
│
└── Converters/         # XAMLコンバーター
    └── ValueConverters.cs
```

## 画面

### LoginPage
- ユーザー名とパスワードでログイン
- 新規ユーザー登録

### ChatPage
- チャンネル一覧（左側）
- メッセージ表示エリア（右側上部）
- メッセージ入力エリア（右側下部）
- リアルタイムメッセージ更新

### ChannelEditPage
- 新規チャンネル作成
- 既存チャンネルの削除

### UserManagementPage
- 全ユーザー一覧表示
- ユーザーのアクティブ状態確認

## ビルド方法

Visual Studio 2022:
1. ソリューションを開く
2. ビルド構成を選択（x64推奨）
3. F5キーでビルド＆実行

コマンドライン:
```bash
dotnet build
dotnet run
```

## 必要な環境

- Windows 10 Version 1809 (Build 17763) 以上
- .NET 8.0 SDK
- Windows App SDK 1.5
