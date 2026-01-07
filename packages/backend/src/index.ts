import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { authService } from './services/auth';
import { channelService } from './services/channel';
import { messageService } from './services/message';
import { userService } from './services/user';
import { storage } from './storage';
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
  // デモユーザーの作成
  const demoUser1 = {
    id: uuidv4(),
    username: 'user1',
    passwordHash: bcrypt.hashSync('password1', 10),
    displayName: 'ユーザー1',
    createdAt: Date.now(),
    isActive: true
  };

  const demoUser2 = {
    id: uuidv4(),
    username: 'user2',
    passwordHash: bcrypt.hashSync('password2', 10),
    displayName: 'ユーザー2',
    createdAt: Date.now(),
    isActive: true
  };

  storage.addUser(demoUser1);
  storage.addUser(demoUser2);

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

  console.log('デモデータを初期化しました');
  console.log('デモユーザー1: username=user1, password=password1');
  console.log('デモユーザー2: username=user2, password=password2');
}
