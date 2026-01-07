import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { authService } from './services/auth';
import { channelService } from './services/channel';
import { messageService } from './services/message';
import { userService } from './services/user';
import { storage } from './storage';
import { initializeDatabase } from './database';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const PROTO_PATH = path.join(__dirname, '../../proto/protos');

// プロトファイルの読み込み
const authPackageDef = protoLoader.loadSync(
  path.join(PROTO_PATH, 'auth.proto'),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
);

const channelPackageDef = protoLoader.loadSync(
  path.join(PROTO_PATH, 'channel.proto'),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
);

const messagePackageDef = protoLoader.loadSync(
  path.join(PROTO_PATH, 'message.proto'),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
);

const userPackageDef = protoLoader.loadSync(
  path.join(PROTO_PATH, 'user.proto'),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
);

const authProto = grpc.loadPackageDefinition(authPackageDef) as any;
const channelProto = grpc.loadPackageDefinition(channelPackageDef) as any;
const messageProto = grpc.loadPackageDefinition(messagePackageDef) as any;
const userProto = grpc.loadPackageDefinition(userPackageDef) as any;

// サーバーの作成
const server = new grpc.Server();

// サービスの追加
server.addService(authProto.chat.AuthService.service, authService);
server.addService(channelProto.chat.ChannelService.service, channelService);
server.addService(messageProto.chat.MessageService.service, messageService);
server.addService(userProto.chat.UserService.service, userService);

const PORT = process.env.PORT || '50051';

// データベースの初期化
initializeDatabase();

// サーバーの起動
server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error('サーバーの起動に失敗しました:', error);
      return;
    }
    console.log(`gRPCサーバーがポート ${port} で起動しました`);

    // デモ用のユーザーとチャンネルを作成
    initializeDemoData();
  }
);

function initializeDemoData() {
  // 既存のユーザーを確認
  const existingUser1 = storage.getUserByUsername('user1');
  const existingUser2 = storage.getUserByUsername('user2');

  let demoUser1 = existingUser1;
  let demoUser2 = existingUser2;

  // ユーザーが存在しない場合のみ作成
  if (!existingUser1) {
    demoUser1 = {
      id: uuidv4(),
      username: 'user1',
      passwordHash: bcrypt.hashSync('password1', 10),
      displayName: 'ユーザー1',
      createdAt: Date.now(),
      isActive: true
    };
    storage.addUser(demoUser1);
    console.log('デモユーザー1を作成しました: username=user1, password=password1');
  }

  if (!existingUser2) {
    demoUser2 = {
      id: uuidv4(),
      username: 'user2',
      passwordHash: bcrypt.hashSync('password2', 10),
      displayName: 'ユーザー2',
      createdAt: Date.now(),
      isActive: true
    };
    storage.addUser(demoUser2);
    console.log('デモユーザー2を作成しました: username=user2, password=password2');
  }

  // チャンネルが既に存在するか確認
  const existingChannels = storage.getAllChannels();
  const hasGeneralChannel = existingChannels.some(ch => ch.name === '一般');

  if (!hasGeneralChannel && demoUser1 && demoUser2) {
    // デモチャンネルの作成
    const demoChannel = {
      id: uuidv4(),
      name: '一般',
      description: 'デモチャンネル',
      createdAt: Date.now(),
      createdBy: demoUser1.id,
      memberIds: [demoUser1.id, demoUser2.id],
      isPrivate: false
    };
    storage.addChannel(demoChannel);
    console.log('デモチャンネルを作成しました');
  }

  console.log('デモデータの初期化が完了しました');
}
