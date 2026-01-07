import * as grpc from '@grpc/grpc-js';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../storage';
import { Message } from '../types';
import { validateToken } from './auth';

// メッセージサブスクリプションの管理
const subscriptions = new Map<string, Set<grpc.ServerWritableStream<any, any>>>();

export const messageService = {
  sendMessage: (call: any, callback: any) => {
    const { channelId, content, token } = call.request;
    const user = validateToken(token);

    if (!user) {
      return callback(null, {
        success: false,
        message: null,
        errorMessage: '認証エラー: 無効なトークン'
      });
    }

    const channel = storage.getChannelById(channelId);
    if (!channel) {
      return callback(null, {
        success: false,
        message: null,
        errorMessage: 'チャンネルが見つかりません'
      });
    }

    if (!channel.memberIds.includes(user.id)) {
      return callback(null, {
        success: false,
        message: null,
        errorMessage: 'このチャンネルへのアクセス権がありません'
      });
    }

    const message: Message = {
      id: uuidv4(),
      channelId,
      userId: user.id,
      username: user.displayName,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storage.addMessage(message);

    // サブスクライバーに通知
    notifySubscribers(channelId, {
      eventType: 0, // MESSAGE_SENT
      message: {
        id: message.id,
        channelId: message.channelId,
        userId: message.userId,
        username: message.username,
        content: message.content,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      }
    });

    callback(null, {
      success: true,
      message: {
        id: message.id,
        channelId: message.channelId,
        userId: message.userId,
        username: message.username,
        content: message.content,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      },
      errorMessage: ''
    });
  },

  listMessages: (call: any, callback: any) => {
    const { channelId, limit, before, token } = call.request;
    const user = validateToken(token);

    if (!user) {
      return callback(null, { messages: [] });
    }

    const channel = storage.getChannelById(channelId);
    if (!channel || !channel.memberIds.includes(user.id)) {
      return callback(null, { messages: [] });
    }

    const messages = storage.getMessagesByChannelId(
      channelId,
      limit || 100,
      before || undefined
    );

    callback(null, {
      messages: messages.map(msg => ({
        id: msg.id,
        channelId: msg.channelId,
        userId: msg.userId,
        username: msg.username,
        content: msg.content,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt
      }))
    });
  },

  subscribeMessages: (call: grpc.ServerWritableStream<any, any>) => {
    const { channelId, token } = call.request;
    const user = validateToken(token);

    if (!user) {
      call.end();
      return;
    }

    const channel = storage.getChannelById(channelId);
    if (!channel || !channel.memberIds.includes(user.id)) {
      call.end();
      return;
    }

    // サブスクリプションを追加
    if (!subscriptions.has(channelId)) {
      subscriptions.set(channelId, new Set());
    }
    subscriptions.get(channelId)!.add(call);

    // クライアントが切断したときにサブスクリプションを削除
    call.on('cancelled', () => {
      const subs = subscriptions.get(channelId);
      if (subs) {
        subs.delete(call);
        if (subs.size === 0) {
          subscriptions.delete(channelId);
        }
      }
    });
  },

  deleteMessage: (call: any, callback: any) => {
    const { messageId, token } = call.request;
    const user = validateToken(token);

    if (!user) {
      return callback(null, {
        success: false,
        errorMessage: '認証エラー: 無効なトークン'
      });
    }

    const message = storage.getMessageById(messageId);
    if (!message) {
      return callback(null, {
        success: false,
        errorMessage: 'メッセージが見つかりません'
      });
    }

    if (message.userId !== user.id) {
      return callback(null, {
        success: false,
        errorMessage: '自分のメッセージのみ削除できます'
      });
    }

    storage.deleteMessage(messageId);

    // サブスクライバーに通知
    notifySubscribers(message.channelId, {
      eventType: 1, // MESSAGE_DELETED
      message: {
        id: message.id,
        channelId: message.channelId,
        userId: message.userId,
        username: message.username,
        content: message.content,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      }
    });

    callback(null, {
      success: true,
      errorMessage: ''
    });
  }
};

function notifySubscribers(channelId: string, event: any) {
  const subs = subscriptions.get(channelId);
  if (!subs) return;

  subs.forEach(stream => {
    try {
      stream.write(event);
    } catch (error) {
      console.error('Error notifying subscriber:', error);
    }
  });
}
