import { userService } from '../services/user';
import { storage } from '../storage';
import * as auth from '../services/auth';

// storageとauthをモック
jest.mock('../storage', () => ({
  storage: {
    getAllUsers: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  }
}));

jest.mock('../services/auth', () => ({
  validateToken: jest.fn(),
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAuthUser = {
    id: 'user-1',
    username: 'authuser',
    passwordHash: 'hash',
    displayName: 'Auth User',
    createdAt: Date.now(),
    isActive: true
  };

  describe('listUsers', () => {
    it('認証されたユーザーがユーザーリストを取得できる', (done) => {
      const mockUsers = [
        {
          id: 'user-1',
          username: 'user1',
          passwordHash: 'hash',
          displayName: 'User 1',
          createdAt: Date.now(),
          isActive: true
        },
        {
          id: 'user-2',
          username: 'user2',
          passwordHash: 'hash',
          displayName: 'User 2',
          createdAt: Date.now(),
          isActive: true
        }
      ];

      (auth.validateToken as jest.Mock).mockReturnValue(mockAuthUser);
      (storage.getAllUsers as jest.Mock).mockReturnValue(mockUsers);

      const call = {
        request: {
          token: 'valid-token'
        }
      };

      userService.listUsers(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.users).toHaveLength(2);
        expect(response.users[0].id).toBe('user-1');
        done();
      });
    });

    it('認証されていないユーザーは空のリストを取得する', (done) => {
      (auth.validateToken as jest.Mock).mockReturnValue(null);

      const call = {
        request: {
          token: 'invalid-token'
        }
      };

      userService.listUsers(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.users).toHaveLength(0);
        done();
      });
    });
  });

  describe('getUser', () => {
    it('ユーザー情報を取得できる', (done) => {
      const mockUser = {
        id: 'user-2',
        username: 'targetuser',
        passwordHash: 'hash',
        displayName: 'Target User',
        createdAt: Date.now(),
        isActive: true
      };

      (auth.validateToken as jest.Mock).mockReturnValue(mockAuthUser);
      (storage.getUserById as jest.Mock).mockReturnValue(mockUser);

      const call = {
        request: {
          userId: 'user-2',
          token: 'valid-token'
        }
      };

      userService.getUser(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(true);
        expect(response.user.id).toBe('user-2');
        done();
      });
    });

    it('認証エラーで失敗する', (done) => {
      (auth.validateToken as jest.Mock).mockReturnValue(null);

      const call = {
        request: {
          userId: 'user-2',
          token: 'invalid-token'
        }
      };

      userService.getUser(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(false);
        expect(response.errorMessage).toBe('認証エラー: 無効なトークン');
        done();
      });
    });
  });

  describe('updateUser', () => {
    it('自分のプロフィールを更新できる', (done) => {
      (auth.validateToken as jest.Mock).mockReturnValue(mockAuthUser);
      (storage.getUserById as jest.Mock).mockReturnValue(mockAuthUser);
      (storage.updateUser as jest.Mock).mockImplementation(() => {});

      const call = {
        request: {
          userId: 'user-1',
          displayName: 'Updated Name',
          token: 'valid-token'
        }
      };

      userService.updateUser(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(true);
        expect(storage.updateUser).toHaveBeenCalled();
        done();
      });
    });

    it('他人のプロフィールは更新できない', (done) => {
      (auth.validateToken as jest.Mock).mockReturnValue(mockAuthUser);

      const call = {
        request: {
          userId: 'user-2',
          displayName: 'Updated Name',
          token: 'valid-token'
        }
      };

      userService.updateUser(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(false);
        expect(response.errorMessage).toBe('自分のプロフィールのみ更新できます');
        done();
      });
    });
  });

  describe('deleteUser', () => {
    it('自分のアカウントを削除できる', (done) => {
      (auth.validateToken as jest.Mock).mockReturnValue(mockAuthUser);
      (storage.deleteUser as jest.Mock).mockReturnValue(true);

      const call = {
        request: {
          userId: 'user-1',
          token: 'valid-token'
        }
      };

      userService.deleteUser(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(true);
        expect(storage.deleteUser).toHaveBeenCalledWith('user-1');
        done();
      });
    });

    it('他人のアカウントは削除できない', (done) => {
      (auth.validateToken as jest.Mock).mockReturnValue(mockAuthUser);

      const call = {
        request: {
          userId: 'user-2',
          token: 'valid-token'
        }
      };

      userService.deleteUser(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(false);
        expect(response.errorMessage).toBe('自分のアカウントのみ削除できます');
        done();
      });
    });
  });

  describe('setUserActive', () => {
    it('自分のアカウントの有効/無効を切り替えられる', (done) => {
      (auth.validateToken as jest.Mock).mockReturnValue(mockAuthUser);
      (storage.getUserById as jest.Mock).mockReturnValue(mockAuthUser);
      (storage.updateUser as jest.Mock).mockImplementation(() => {});

      const call = {
        request: {
          userId: 'user-1',
          isActive: false,
          token: 'valid-token'
        }
      };

      userService.setUserActive(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(true);
        expect(storage.updateUser).toHaveBeenCalled();
        done();
      });
    });

    it('他人のアカウントは変更できない', (done) => {
      (auth.validateToken as jest.Mock).mockReturnValue(mockAuthUser);

      const call = {
        request: {
          userId: 'user-2',
          isActive: false,
          token: 'valid-token'
        }
      };

      userService.setUserActive(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(false);
        expect(response.errorMessage).toBe('自分のアカウントのみ変更できます');
        done();
      });
    });
  });
});
