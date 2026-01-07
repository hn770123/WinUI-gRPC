# ChatApp フロントエンドテスト

このディレクトリには、WinUI 3 チャットアプリケーションのフロントエンドテストが含まれています。

## テストフレームワーク

- **xUnit**: .NET向けの単体テストフレームワーク
- **Moq**: モックライブラリ(依存関係のモック作成用)

## テストの構成

### Services/GrpcClientServiceTests.cs
gRPCクライアントサービスの統合テストです。これらのテストは実際のgRPCサーバーが動作している必要があります。

主なテストケース:
- コンストラクタの初期化
- 無効な認証情報でのログイン
- 認証なしでのリソースアクセス
- エラーハンドリング

### ViewModels/LoginViewModelTests.cs
ログインビューモデルの単体テストです。プロパティの動作を検証します。

主なテストケース:
- プロパティの初期化
- プロパティ変更の検証
- (コメントアウト) モックを使用した認証ロジックのテスト

### ViewModels/ChatViewModelTests.cs
チャットビューモデルの単体テストです。コレクションとプロパティの動作を検証します。

主なテストケース:
- コレクションの初期化
- プロパティ変更の検証
- (コメントアウト) モックを使用したチャネル/メッセージ管理のテスト

## テストの実行

### 前提条件
- .NET 8.0 SDK以上がインストールされていること
- Windows 10/11 (WinUI 3要件)

### すべてのテストを実行
```bash
cd packages/frontend.tests
dotnet test
```

### カバレッジレポート付きで実行
```bash
dotnet test --collect:"XPlat Code Coverage"
```

### 詳細な出力で実行
```bash
dotnet test --logger "console;verbosity=detailed"
```

## 注意事項

### 依存性注入について
現在のViewModelの実装は、静的な`App.GrpcClient`に依存しています。これにより、ViewModelの単体テストでモックを使用することが困難になっています。

**推奨される改善:**
1. `IGrpcClientService`インターフェースを作成
2. ViewModelのコンストラクタでサービスを注入
3. 依存性注入コンテナ(Microsoft.Extensions.DependencyInjection)を使用

実装例:
```csharp
public class LoginViewModel : ObservableObject
{
    private readonly IGrpcClientService _grpcClient;

    public LoginViewModel(IGrpcClientService grpcClient)
    {
        _grpcClient = grpcClient;
    }

    // ...
}
```

### 統合テストの実行
`GrpcClientServiceTests`の統合テストを実行する場合は、事前にバックエンドサーバーを起動する必要があります:

```bash
# 別のターミナルで
cd packages/backend
npm run dev
```

その後、テストを実行します。

## テストのベストプラクティス

1. **Arrange-Act-Assert (AAA) パターン**: すべてのテストはこのパターンに従っています
2. **明確なテスト名**: テストメソッド名は動作と期待結果を明確に示しています
3. **独立性**: 各テストは他のテストに依存せず、単独で実行可能です
4. **モックの使用**: 外部依存関係はモックを使用して分離します

## モックテストの例

コメントアウトされているテストは、依存性注入を実装した後に有効化できるモックテストの例です。これらは以下をテストします:

- ログイン成功/失敗のシナリオ
- バリデーションエラー
- チャネルとメッセージの読み込み
- メッセージ送信

これらのテストを有効化するには:
1. ViewModelに依存性注入を実装
2. テストコードのコメントを解除
3. 必要に応じてテストを調整

## カバレッジ目標

- **最小カバレッジ**: 70%
- **推奨カバレッジ**: 80%以上
- **重要なビジネスロジック**: 90%以上

## トラブルシューティング

### テストが失敗する場合
1. .NET SDKのバージョンを確認: `dotnet --version`
2. 依存関係を復元: `dotnet restore`
3. プロジェクトをクリーン: `dotnet clean`

### 統合テストがタイムアウトする場合
- バックエンドサーバーが起動していることを確認
- サーバーアドレス(`http://localhost:50051`)が正しいことを確認
- ファイアウォール設定を確認
