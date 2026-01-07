# システムフロー図とテストの相関

このドキュメントでは、WinUI-gRPCチャットアプリケーションのシステムフローと、各フローに対応するテストプログラムの関係を示します。

## 目次

1. [全体アーキテクチャ](#全体アーキテクチャ)
2. [認証フロー](#認証フロー)
3. [メッセージングフロー](#メッセージングフロー)
4. [チャンネル管理フロー](#チャンネル管理フロー)
5. [ユーザー管理フロー](#ユーザー管理フロー)
6. [テストカバレッジマップ](#テストカバレッジマップ)

---

## 全体アーキテクチャ

システムは3層アーキテクチャで構成されています。

```mermaid
graph TB
    subgraph "フロントエンド層 (WinUI 3 / C#)"
        UI[Views/Pages<br/>XAML UI]
        VM[ViewModels<br/>MVVM Pattern]
        GCS[GrpcClientService<br/>gRPCクライアント]
    end

    subgraph "通信層"
        GRPC[gRPC<br/>Protocol Buffers]
    end

    subgraph "バックエンド層 (Node.js / TypeScript)"
        AS[AuthService<br/>認証サービス]
        MS[MessageService<br/>メッセージサービス]
        CS[ChannelService<br/>チャンネルサービス]
        US[UserService<br/>ユーザーサービス]
        STORAGE[Storage Layer<br/>SQLite Database]
    end

    subgraph "テスト層"
        FT[Frontend Tests<br/>xUnit + Moq]
        BT[Backend Tests<br/>Jest]
    end

    UI --> VM
    VM --> GCS
    GCS --> GRPC
    GRPC --> AS
    GRPC --> MS
    GRPC --> CS
    GRPC --> US
    AS --> STORAGE
    MS --> STORAGE
    CS --> STORAGE
    US --> STORAGE

    FT -.テスト対象.-> GCS
    FT -.テスト対象.-> VM
    BT -.テスト対象.-> AS
    BT -.テスト対象.-> MS
    BT -.テスト対象.-> CS
    BT -.テスト対象.-> US

    style FT fill:#e1f5ff
    style BT fill:#e1f5ff
    style STORAGE fill:#ffe1e1
```

**テスト対応:**
- **フロントエンドテスト** (`packages/frontend.tests/`): ViewModels, GrpcClientService
- **バックエンドテスト** (`packages/backend/src/__tests__/`): 各gRPCサービスロジック

---

## 認証フロー

ユーザー認証（ログイン、登録、トークン検証）のフロー図です。

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant LP as LoginPage<br/>(View)
    participant LVM as LoginViewModel
    participant GCS as GrpcClientService
    participant AS as AuthService<br/>(Backend)
    participant DB as SQLite Database

    Note over User,DB: ログインフロー

    User->>LP: ユーザー名/パスワード入力
    LP->>LVM: LoginCommand実行
    LVM->>GCS: LoginAsync(username, password)
    GCS->>AS: Login gRPC Call
    AS->>DB: getUserByUsername()
    DB-->>AS: ユーザー情報
    AS->>AS: bcryptでパスワード検証
    AS->>DB: addSession(token, userId)
    AS-->>GCS: トークン + ユーザー情報
    GCS->>GCS: CurrentToken/CurrentUser設定
    GCS-->>LVM: (success, error)
    LVM->>LVM: LoginSucceededイベント発火
    LVM-->>LP: ChatPageへ遷移
    LP-->>User: チャット画面表示

    Note over User,DB: 登録フロー

    User->>LP: 新規登録ボタン
    LP->>LVM: RegisterCommand実行
    LVM->>GCS: RegisterAsync(username, password, displayName)
    GCS->>AS: Register gRPC Call
    AS->>DB: getUserByUsername()で重複チェック
    AS->>AS: bcryptでパスワードハッシュ化
    AS->>DB: addUser()
    AS-->>GCS: ユーザー情報
    GCS-->>LVM: (success, error)
    LVM-->>User: 登録完了メッセージ
```

**テスト対応:**

| テストファイル | テスト内容 | 対応コード |
|--------------|----------|----------|
| `frontend.tests/ViewModels/LoginViewModelTests.cs` | プロパティバインディング<br/>入力バリデーション | `LoginViewModel.cs:20-85` |
| `frontend.tests/Services/GrpcClientServiceTests.cs` | ログイン/登録の統合テスト<br/>エラーハンドリング | `GrpcClientService.cs:36-81` |
| `backend/__tests__/auth.test.ts` | ログイン成功/失敗<br/>パスワード検証<br/>トークン生成<br/>ユーザー登録 | `services/auth.ts:23-95` |

**テストケース例:**
- ✅ 正しいユーザー名とパスワードでログイン成功 (`auth.test.ts:23`)
- ❌ 存在しないユーザー名でログイン失敗 (`auth.test.ts:52`)
- ❌ 間違ったパスワードでログイン失敗 (`auth.test.ts:70`)
- ❌ 無効化されたユーザーでログイン失敗 (`auth.test.ts:97`)
- ✅ 新規ユーザー登録成功 (`auth.test.ts:197`)
- ❌ 既存ユーザー名での登録拒否 (`auth.test.ts:218`)

---

## メッセージングフロー

メッセージの送信、取得、リアルタイム更新のフロー図です。

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant CP as ChatPage<br/>(View)
    participant CVM as ChatViewModel
    participant GCS as GrpcClientService
    participant MS as MessageService<br/>(Backend)
    participant DB as SQLite Database

    Note over User,DB: メッセージ送信フロー

    User->>CP: メッセージ入力
    CP->>CVM: SendMessageCommand実行
    CVM->>GCS: SendMessageAsync(channelId, content)
    GCS->>MS: SendMessage gRPC Call + Token
    MS->>MS: validateToken()で認証
    MS->>DB: getChannelById()
    DB-->>MS: チャンネル情報
    MS->>MS: メンバーシップチェック
    MS->>DB: addMessage()
    DB-->>MS: メッセージ保存完了
    MS-->>GCS: メッセージ情報
    GCS-->>CVM: (success, error)
    CVM->>CVM: NewMessageをクリア

    Note over User,DB: メッセージ取得フロー

    CVM->>GCS: GetMessagesAsync(channelId, limit)
    GCS->>MS: ListMessages gRPC Call + Token
    MS->>MS: validateToken()で認証
    MS->>DB: getChannelById()
    MS->>DB: getMessagesByChannelId(limit)
    DB-->>MS: メッセージリスト
    MS-->>GCS: メッセージ配列
    GCS-->>CVM: Message配列
    CVM->>CVM: Messages.Clear() + Add
    CVM-->>CP: UIに表示

    Note over User,DB: リアルタイム更新 (gRPCストリーミング)

    CVM->>GCS: SubscribeToMessages(channelId)
    GCS->>MS: StreamMessages gRPC Stream + Token
    loop リアルタイム配信
        MS->>DB: 新しいメッセージを監視
        DB-->>MS: 新規メッセージ
        MS-->>GCS: Stream Message
        GCS->>CVM: MessageReceivedイベント
        CVM->>CVM: Messages.Add(newMessage)
        CVM-->>CP: UIを自動更新
    end
```

**テスト対応:**

| テストファイル | テスト内容 | 対応コード |
|--------------|----------|----------|
| `frontend.tests/ViewModels/ChatViewModelTests.cs` | メッセージリスト管理<br/>チャンネル選択時の動作<br/>送信ロジック | `ChatViewModel.cs:38-85` |
| `frontend.tests/Services/GrpcClientServiceTests.cs` | 認証なしでのメッセージ送信失敗 | `GrpcClientService.cs:105-116` |
| `backend/__tests__/message.test.ts` | メッセージ送信<br/>メッセージ取得<br/>メッセージ削除<br/>権限チェック | `services/message.ts:44-130` |

**テストケース例:**
- ✅ メッセージ送信成功 (`message.test.ts:45`)
- ❌ 認証エラーで送信失敗 (`message.test.ts:68`)
- ❌ 存在しないチャンネルへの送信失敗 (`message.test.ts:87`)
- ❌ メンバーでない場合は送信拒否 (`message.test.ts:107`)
- ✅ チャンネルのメッセージリスト取得 (`message.test.ts:134`)
- ✅ 自分のメッセージ削除成功 (`message.test.ts:189`)
- ❌ 他人のメッセージは削除不可 (`message.test.ts:219`)

---

## チャンネル管理フロー

チャンネルの作成、更新、削除のフロー図です。

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant CEP as ChannelEditPage<br/>(View)
    participant CEVM as ChannelEditViewModel
    participant GCS as GrpcClientService
    participant CS as ChannelService<br/>(Backend)
    participant DB as SQLite Database

    Note over User,DB: チャンネル作成フロー

    User->>CEP: チャンネル名/説明入力
    CEP->>CEVM: CreateChannelCommand実行
    CEVM->>GCS: CreateChannelAsync(name, description, isPrivate)
    GCS->>CS: CreateChannel gRPC Call + Token
    CS->>CS: validateToken()で認証
    CS->>DB: addChannel()
    DB-->>CS: チャンネル保存完了
    CS-->>GCS: チャンネル情報
    GCS-->>CEVM: (success, channel, error)
    CEVM-->>CEP: チャンネル一覧画面に戻る

    Note over User,DB: チャンネル削除フロー

    User->>CEP: 削除ボタンクリック
    CEP->>CEVM: DeleteChannelCommand実行
    CEVM->>GCS: DeleteChannelAsync(channelId)
    GCS->>CS: DeleteChannel gRPC Call + Token
    CS->>CS: validateToken()で認証
    CS->>DB: getChannelById()
    DB-->>CS: チャンネル情報
    CS->>CS: 作成者権限チェック
    CS->>DB: deleteChannel()
    CS->>DB: deleteMessagesByChannelId()
    CS-->>GCS: 削除完了
    GCS-->>CEVM: (success, error)

    Note over User,DB: チャンネルメンバー管理フロー

    User->>CEP: メンバー追加/削除
    CEP->>CEVM: AddMemberCommand実行
    CEVM->>GCS: AddChannelMemberAsync(channelId, userId)
    GCS->>CS: AddChannelMember gRPC Call + Token
    CS->>CS: validateToken()で認証
    CS->>DB: getChannelById()
    CS->>CS: 権限チェック
    CS->>DB: updateChannel(memberIds)
    CS-->>GCS: 更新完了
    GCS-->>CEVM: (success, error)
```

**テスト対応:**

| テストファイル | テスト内容 | 対応コード |
|--------------|----------|----------|
| `frontend.tests/Services/GrpcClientServiceTests.cs` | 認証なしでのチャンネル作成失敗 | `GrpcClientService.cs:120-133` |
| `backend/__tests__/channel.test.ts` | チャンネル作成<br/>チャンネル更新<br/>チャンネル削除<br/>メンバー管理<br/>権限チェック | `services/channel.ts:全体` |

**テストケース例:**
- ✅ チャンネル作成成功
- ✅ プライベートチャンネル作成
- ✅ チャンネル更新（作成者のみ）
- ❌ 作成者以外は更新不可
- ✅ チャンネル削除（作成者のみ）
- ✅ メンバー追加/削除
- ❌ メンバーでないユーザーのアクセス拒否

---

## ユーザー管理フロー

ユーザー情報の取得、更新、削除のフロー図です。

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant UMP as UserManagementPage<br/>(View)
    participant UMVM as UserManagementViewModel
    participant GCS as GrpcClientService
    participant US as UserService<br/>(Backend)
    participant DB as SQLite Database

    Note over User,DB: ユーザー一覧取得フロー

    User->>UMP: ユーザー管理画面を開く
    UMP->>UMVM: LoadUsersCommand実行
    UMVM->>GCS: GetUsersAsync()
    GCS->>US: ListUsers gRPC Call + Token
    US->>US: validateToken()で認証
    US->>DB: getAllUsers()
    DB-->>US: ユーザーリスト
    US-->>GCS: ユーザー配列
    GCS-->>UMVM: User配列
    UMVM-->>UMP: ユーザー一覧表示

    Note over User,DB: ユーザー情報更新フロー

    User->>UMP: ユーザー情報編集
    UMP->>UMVM: UpdateUserCommand実行
    UMVM->>GCS: UpdateUserAsync(userId, displayName)
    GCS->>US: UpdateUser gRPC Call + Token
    US->>US: validateToken()で認証
    US->>DB: getUserById()
    US->>US: 権限チェック（本人のみ）
    US->>DB: updateUser()
    US-->>GCS: 更新完了
    GCS-->>UMVM: (success, error)

    Note over User,DB: ユーザー削除/無効化フロー

    User->>UMP: ユーザー削除ボタン
    UMP->>UMVM: DeleteUserCommand実行
    UMVM->>GCS: DeleteUserAsync(userId)
    GCS->>US: DeleteUser gRPC Call + Token
    US->>US: validateToken()で認証
    US->>DB: getUserById()
    US->>US: 権限チェック（本人のみ）
    US->>DB: updateUser(isActive=false)
    US-->>GCS: 無効化完了
    GCS-->>UMVM: (success, error)
```

**テスト対応:**

| テストファイル | テスト内容 | 対応コード |
|--------------|----------|----------|
| `frontend.tests/Services/GrpcClientServiceTests.cs` | 認証なしでのユーザー取得 | `GrpcClientService.cs:94-102` |
| `backend/__tests__/user.test.ts` | ユーザー取得<br/>ユーザー更新<br/>ユーザー削除<br/>権限チェック | `services/user.ts:全体` |

**テストケース例:**
- ✅ ユーザー一覧取得
- ✅ ユーザー情報更新（本人のみ）
- ❌ 他人のユーザー情報更新不可
- ✅ ユーザー削除/無効化（本人のみ）
- ❌ 他人のユーザー削除不可

---

## テストカバレッジマップ

システム全体のテストカバレッジを視覚化します。

```mermaid
graph TB
    subgraph "フロントエンドテスト Coverage"
        FT1[LoginViewModelTests.cs]
        FT2[ChatViewModelTests.cs]
        FT3[GrpcClientServiceTests.cs]
    end

    subgraph "バックエンドテスト Coverage"
        BT1[auth.test.ts]
        BT2[message.test.ts]
        BT3[channel.test.ts]
        BT4[user.test.ts]
    end

    subgraph "テスト対象コンポーネント"
        direction TB

        subgraph "Frontend Components"
            LVM[LoginViewModel]
            CVM[ChatViewModel]
            GCS[GrpcClientService]
        end

        subgraph "Backend Services"
            AS[AuthService]
            MS[MessageService]
            CS[ChannelService]
            US[UserService]
        end

        subgraph "Storage Layer"
            DB[(SQLite Database)]
        end
    end

    FT1 -.プロパティテスト.-> LVM
    FT2 -.プロパティテスト.-> CVM
    FT3 -.統合テスト.-> GCS
    FT3 -.E2E風テスト.-> AS
    FT3 -.E2E風テスト.-> MS
    FT3 -.E2E風テスト.-> CS
    FT3 -.E2E風テスト.-> US

    BT1 -.ユニットテスト.-> AS
    BT2 -.ユニットテスト.-> MS
    BT3 -.ユニットテスト.-> CS
    BT4 -.ユニットテスト.-> US

    LVM --> GCS
    CVM --> GCS
    GCS --> AS
    GCS --> MS
    GCS --> CS
    GCS --> US

    AS --> DB
    MS --> DB
    CS --> DB
    US --> DB

    style FT1 fill:#c8e6c9
    style FT2 fill:#c8e6c9
    style FT3 fill:#c8e6c9
    style BT1 fill:#bbdefb
    style BT2 fill:#bbdefb
    style BT3 fill:#bbdefb
    style BT4 fill:#bbdefb
    style DB fill:#ffccbc
```

### テストカバレッジ詳細

| レイヤー | コンポーネント | テストファイル | カバレッジ内容 |
|---------|-------------|-------------|-------------|
| **Frontend ViewModels** | LoginViewModel | `LoginViewModelTests.cs` | ✅ プロパティバインディング<br/>✅ 入力バリデーション<br/>⚠️ コマンド実行（依存性注入が必要） |
| | ChatViewModel | `ChatViewModelTests.cs` | ✅ コレクション初期化<br/>✅ チャンネル選択<br/>⚠️ メッセージ送受信（依存性注入が必要） |
| **Frontend Services** | GrpcClientService | `GrpcClientServiceTests.cs` | ✅ 認証なしでのエラーハンドリング<br/>✅ 各API呼び出しの基本動作<br/>⚠️ 実際のサーバー必要（統合テスト） |
| **Backend Services** | AuthService | `auth.test.ts` | ✅ ログイン成功/失敗<br/>✅ ユーザー登録<br/>✅ トークン検証<br/>✅ パスワードハッシュ化 |
| | MessageService | `message.test.ts` | ✅ メッセージ送信/取得/削除<br/>✅ 認証チェック<br/>✅ 権限チェック |
| | ChannelService | `channel.test.ts` | ✅ チャンネルCRUD<br/>✅ メンバー管理<br/>✅ 権限チェック |
| | UserService | `user.test.ts` | ✅ ユーザーCRUD<br/>✅ 権限チェック<br/>✅ 無効化処理 |

### テスト実行方法

#### フロントエンドテスト

```bash
cd packages/frontend.tests
dotnet test
```

**詳細出力:**
```bash
dotnet test --logger "console;verbosity=detailed"
```

**カバレッジレポート:**
```bash
dotnet test --collect:"XPlat Code Coverage"
```

#### バックエンドテスト

```bash
cd packages/backend
npm test
```

**ウォッチモード:**
```bash
npm run test:watch
```

**カバレッジレポート:**
```bash
npm run test:coverage
```

---

## まとめ

このシステムは以下の特徴を持ちます:

1. **3層アーキテクチャ**: プレゼンテーション層（WinUI 3）、ビジネスロジック層（Node.js gRPCサービス）、データ層（SQLite）
2. **包括的なテストカバレッジ**: フロントエンドとバックエンドの両方でユニットテストを実装
3. **認証とセキュリティ**: トークンベース認証、パスワードハッシュ化、権限チェック
4. **リアルタイム通信**: gRPCストリーミングによるメッセージのリアルタイム配信

### 今後の改善提案

- [ ] フロントエンドViewModelに依存性注入を実装し、完全なユニットテストを可能にする
- [ ] E2Eテストの追加（Playwright、Seleniumなど）
- [ ] パフォーマンステストの追加
- [ ] セキュリティテスト（ペネトレーションテスト、脆弱性スキャン）
- [ ] CI/CDパイプラインでの自動テスト実行
