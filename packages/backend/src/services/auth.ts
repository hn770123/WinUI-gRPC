import * as grpc from '@grpc/grpc-js';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../storage';
import { User, Session } from '../types';

export const authService = {
  login: (call: any, callback: any) => {
    const { username, password } = call.request;

    const user = storage.getUserByUsername(username);
    if (!user) {
      return callback(null, {
        success: false,
        token: '',
        user: null,
        errorMessage: 'ユーザー名またはパスワードが正しくありません'
      });
    }

    const validPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!validPassword) {
      return callback(null, {
        success: false,
        token: '',
        user: null,
        errorMessage: 'ユーザー名またはパスワードが正しくありません'
      });
    }

    if (!user.isActive) {
      return callback(null, {
        success: false,
        token: '',
        user: null,
        errorMessage: 'このユーザーは無効化されています'
      });
    }

    const token = uuidv4();
    const session: Session = {
      token,
      userId: user.id,
      createdAt: Date.now()
    };
    storage.addSession(session);

    callback(null, {
      success: true,
      token,
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

  logout: (call: any, callback: any) => {
    const { token } = call.request;
    storage.deleteSession(token);
    callback(null, { success: true });
  },

  validateToken: (call: any, callback: any) => {
    const { token } = call.request;
    const session = storage.getSession(token);

    if (!session) {
      return callback(null, { valid: false, user: null });
    }

    const user = storage.getUserById(session.userId);
    if (!user || !user.isActive) {
      storage.deleteSession(token);
      return callback(null, { valid: false, user: null });
    }

    callback(null, {
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt,
        isActive: user.isActive
      }
    });
  },

  register: (call: any, callback: any) => {
    const { username, password, displayName } = call.request;

    if (storage.getUserByUsername(username)) {
      return callback(null, {
        success: false,
        user: null,
        errorMessage: 'このユーザー名は既に使用されています'
      });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user: User = {
      id: uuidv4(),
      username,
      passwordHash,
      displayName: displayName || username,
      createdAt: Date.now(),
      isActive: true
    };

    storage.addUser(user);

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
  }
};

export function validateToken(token: string): User | null {
  const session = storage.getSession(token);
  if (!session) return null;

  const user = storage.getUserById(session.userId);
  if (!user || !user.isActive) {
    storage.deleteSession(token);
    return null;
  }

  return user;
}
