import * as grpc from '@grpc/grpc-js';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../storage';
import { Channel } from '../types';
import { validateToken } from './auth';

export const channelService = {
  createChannel: (call: any, callback: any) => {
    const { name, description, isPrivate, token } = call.request;
    const user = validateToken(token);

    if (!user) {
      return callback(null, {
        success: false,
        channel: null,
        errorMessage: '認証エラー: 無効なトークン'
      });
    }

    const channel: Channel = {
      id: uuidv4(),
      name,
      description: description || '',
      createdAt: Date.now(),
      createdBy: user.id,
      memberIds: [user.id],
      isPrivate: isPrivate || false
    };

    storage.addChannel(channel);

    callback(null, {
      success: true,
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        createdAt: channel.createdAt,
        createdBy: channel.createdBy,
        memberIds: channel.memberIds,
        isPrivate: channel.isPrivate
      },
      errorMessage: ''
    });
  },

  listChannels: (call: any, callback: any) => {
    const { token } = call.request;
    const user = validateToken(token);

    if (!user) {
      return callback(null, { channels: [] });
    }

    const channels = storage.getChannelsByUserId(user.id);

    callback(null, {
      channels: channels.map(ch => ({
        id: ch.id,
        name: ch.name,
        description: ch.description,
        createdAt: ch.createdAt,
        createdBy: ch.createdBy,
        memberIds: ch.memberIds,
        isPrivate: ch.isPrivate
      }))
    });
  },

  getChannel: (call: any, callback: any) => {
    const { channelId, token } = call.request;
    const user = validateToken(token);

    if (!user) {
      return callback(null, {
        success: false,
        channel: null,
        errorMessage: '認証エラー: 無効なトークン'
      });
    }

    const channel = storage.getChannelById(channelId);
    if (!channel) {
      return callback(null, {
        success: false,
        channel: null,
        errorMessage: 'チャンネルが見つかりません'
      });
    }

    if (!channel.memberIds.includes(user.id)) {
      return callback(null, {
        success: false,
        channel: null,
        errorMessage: 'このチャンネルへのアクセス権がありません'
      });
    }

    callback(null, {
      success: true,
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        createdAt: channel.createdAt,
        createdBy: channel.createdBy,
        memberIds: channel.memberIds,
        isPrivate: channel.isPrivate
      },
      errorMessage: ''
    });
  },

  updateChannel: (call: any, callback: any) => {
    const { channelId, name, description, token } = call.request;
    const user = validateToken(token);

    if (!user) {
      return callback(null, {
        success: false,
        channel: null,
        errorMessage: '認証エラー: 無効なトークン'
      });
    }

    const channel = storage.getChannelById(channelId);
    if (!channel) {
      return callback(null, {
        success: false,
        channel: null,
        errorMessage: 'チャンネルが見つかりません'
      });
    }

    if (channel.createdBy !== user.id) {
      return callback(null, {
        success: false,
        channel: null,
        errorMessage: 'チャンネルの作成者のみが更新できます'
      });
    }

    channel.name = name;
    channel.description = description;
    storage.updateChannel(channel);

    callback(null, {
      success: true,
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        createdAt: channel.createdAt,
        createdBy: channel.createdBy,
        memberIds: channel.memberIds,
        isPrivate: channel.isPrivate
      },
      errorMessage: ''
    });
  },

  deleteChannel: (call: any, callback: any) => {
    const { channelId, token } = call.request;
    const user = validateToken(token);

    if (!user) {
      return callback(null, {
        success: false,
        errorMessage: '認証エラー: 無効なトークン'
      });
    }

    const channel = storage.getChannelById(channelId);
    if (!channel) {
      return callback(null, {
        success: false,
        errorMessage: 'チャンネルが見つかりません'
      });
    }

    if (channel.createdBy !== user.id) {
      return callback(null, {
        success: false,
        errorMessage: 'チャンネルの作成者のみが削除できます'
      });
    }

    storage.deleteChannel(channelId);

    callback(null, {
      success: true,
      errorMessage: ''
    });
  },

  addChannelMember: (call: any, callback: any) => {
    const { channelId, userId, token } = call.request;
    const user = validateToken(token);

    if (!user) {
      return callback(null, {
        success: false,
        errorMessage: '認証エラー: 無効なトークン'
      });
    }

    const channel = storage.getChannelById(channelId);
    if (!channel) {
      return callback(null, {
        success: false,
        errorMessage: 'チャンネルが見つかりません'
      });
    }

    if (channel.createdBy !== user.id) {
      return callback(null, {
        success: false,
        errorMessage: 'チャンネルの作成者のみがメンバーを追加できます'
      });
    }

    if (!channel.memberIds.includes(userId)) {
      channel.memberIds.push(userId);
      storage.updateChannel(channel);
    }

    callback(null, {
      success: true,
      errorMessage: ''
    });
  },

  removeChannelMember: (call: any, callback: any) => {
    const { channelId, userId, token } = call.request;
    const user = validateToken(token);

    if (!user) {
      return callback(null, {
        success: false,
        errorMessage: '認証エラー: 無効なトークン'
      });
    }

    const channel = storage.getChannelById(channelId);
    if (!channel) {
      return callback(null, {
        success: false,
        errorMessage: 'チャンネルが見つかりません'
      });
    }

    if (channel.createdBy !== user.id) {
      return callback(null, {
        success: false,
        errorMessage: 'チャンネルの作成者のみがメンバーを削除できます'
      });
    }

    channel.memberIds = channel.memberIds.filter(id => id !== userId);
    storage.updateChannel(channel);

    callback(null, {
      success: true,
      errorMessage: ''
    });
  }
};
