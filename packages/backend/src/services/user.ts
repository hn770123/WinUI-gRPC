import * as grpc from '@grpc/grpc-js';
import { storage } from '../storage';
import { validateToken } from './auth';

export const userService = {
  listUsers: (call: any, callback: any) => {
    const { token } = call.request;
    const user = validateToken(token);

    if (!user) {
      return callback(null, { users: [] });
    }

    const users = storage.getAllUsers();

    callback(null, {
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        createdAt: u.createdAt,
        isActive: u.isActive
      }))
    });
  },

  getUser: (call: any, callback: any) => {
    const { userId, token } = call.request;
    const requestUser = validateToken(token);

    if (!requestUser) {
      return callback(null, {
        success: false,
        user: null,
        errorMessage: '認証エラー: 無効なトークン'
      });
    }

    const user = storage.getUserById(userId);
    if (!user) {
      return callback(null, {
        success: false,
        user: null,
        errorMessage: 'ユーザーが見つかりません'
      });
    }

    callback(null, {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt,
        isActive: user.isActive
      },
      errorMessage: ''
    });
  },

  updateUser: (call: any, callback: any) => {
    const { userId, displayName, token } = call.request;
    const requestUser = validateToken(token);

    if (!requestUser) {
      return callback(null, {
        success: false,
        user: null,
        errorMessage: '認証エラー: 無効なトークン'
      });
    }

    if (requestUser.id !== userId) {
      return callback(null, {
        success: false,
        user: null,
        errorMessage: '自分のプロフィールのみ更新できます'
      });
    }

    const user = storage.getUserById(userId);
    if (!user) {
      return callback(null, {
        success: false,
        user: null,
        errorMessage: 'ユーザーが見つかりません'
      });
    }

    user.displayName = displayName;
    storage.updateUser(user);

    callback(null, {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt,
        isActive: user.isActive
      },
      errorMessage: ''
    });
  },

  deleteUser: (call: any, callback: any) => {
    const { userId, token } = call.request;
    const requestUser = validateToken(token);

    if (!requestUser) {
      return callback(null, {
        success: false,
        errorMessage: '認証エラー: 無効なトークン'
      });
    }

    if (requestUser.id !== userId) {
      return callback(null, {
        success: false,
        errorMessage: '自分のアカウントのみ削除できます'
      });
    }

    const deleted = storage.deleteUser(userId);
    if (!deleted) {
      return callback(null, {
        success: false,
        errorMessage: 'ユーザーが見つかりません'
      });
    }

    callback(null, {
      success: true,
      errorMessage: ''
    });
  },

  setUserActive: (call: any, callback: any) => {
    const { userId, isActive, token } = call.request;
    const requestUser = validateToken(token);

    if (!requestUser) {
      return callback(null, {
        success: false,
        errorMessage: '認証エラー: 無効なトークン'
      });
    }

    if (requestUser.id !== userId) {
      return callback(null, {
        success: false,
        errorMessage: '自分のアカウントのみ変更できます'
      });
    }

    const user = storage.getUserById(userId);
    if (!user) {
      return callback(null, {
        success: false,
        errorMessage: 'ユーザーが見つかりません'
      });
    }

    user.isActive = isActive;
    storage.updateUser(user);

    callback(null, {
      success: true,
      errorMessage: ''
    });
  }
};
