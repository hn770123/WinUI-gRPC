import { authService, validateToken } from '../services/auth';
import { storage } from '../storage';
import * as bcrypt from 'bcryptjs';

// storageをモック
jest.mock('../storage', () => ({
  storage: {
    getUserByUsername: jest.fn(),
    getUserById: jest.fn(),
    addSession: jest.fn(),
    getSession: jest.fn(),
    deleteSession: jest.fn(),
    addUser: jest.fn(),
  }
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('正しいユーザー名とパスワードでログインに成功する', (done) => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        passwordHash: bcrypt.hashSync('password123', 10),
        displayName: 'Test User',
        createdAt: Date.now(),
        isActive: true
      };

      (storage.getUserByUsername as jest.Mock).mockReturnValue(mockUser);

      const call = {
        request: {
          username: 'testuser',
          password: 'password123'
        }
      };

      authService.login(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(true);
        expect(response.token).toBeTruthy();
        expect(response.user.id).toBe('user-1');
        expect(storage.addSession).toHaveBeenCalled();
        done();
      });
    });

    it('存在しないユーザー名でログインに失敗する', (done) => {
      (storage.getUserByUsername as jest.Mock).mockReturnValue(undefined);

      const call = {
        request: {
          username: 'nonexistent',
          password: 'password123'
        }
      };

      authService.login(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(false);
        expect(response.errorMessage).toBe('ユーザー名またはパスワードが正しくありません');
        done();
      });
    });

    it('間違ったパスワードでログインに失敗する', (done) => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        passwordHash: bcrypt.hashSync('password123', 10),
        displayName: 'Test User',
        createdAt: Date.now(),
        isActive: true
      };

      (storage.getUserByUsername as jest.Mock).mockReturnValue(mockUser);

      const call = {
        request: {
          username: 'testuser',
          password: 'wrongpassword'
        }
      };

      authService.login(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(false);
        expect(response.errorMessage).toBe('ユーザー名またはパスワードが正しくありません');
        done();
      });
    });

    it('無効化されたユーザーでログインに失敗する', (done) => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        passwordHash: bcrypt.hashSync('password123', 10),
        displayName: 'Test User',
        createdAt: Date.now(),
        isActive: false
      };

      (storage.getUserByUsername as jest.Mock).mockReturnValue(mockUser);

      const call = {
        request: {
          username: 'testuser',
          password: 'password123'
        }
      };

      authService.login(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(false);
        expect(response.errorMessage).toBe('このユーザーは無効化されています');
        done();
      });
    });
  });

  describe('logout', () => {
    it('ログアウトに成功する', (done) => {
      (storage.deleteSession as jest.Mock).mockReturnValue(true);

      const call = {
        request: {
          token: 'test-token'
        }
      };

      authService.logout(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(true);
        expect(storage.deleteSession).toHaveBeenCalledWith('test-token');
        done();
      });
    });
  });

  describe('validateToken', () => {
    it('有効なトークンを検証できる', (done) => {
      const mockSession = {
        token: 'valid-token',
        userId: 'user-1',
        createdAt: Date.now()
      };

      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        passwordHash: 'hash',
        displayName: 'Test User',
        createdAt: Date.now(),
        isActive: true
      };

      (storage.getSession as jest.Mock).mockReturnValue(mockSession);
      (storage.getUserById as jest.Mock).mockReturnValue(mockUser);

      const call = {
        request: {
          token: 'valid-token'
        }
      };

      authService.validateToken(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.valid).toBe(true);
        expect(response.user.id).toBe('user-1');
        done();
      });
    });

    it('無効なトークンを拒否する', (done) => {
      (storage.getSession as jest.Mock).mockReturnValue(undefined);

      const call = {
        request: {
          token: 'invalid-token'
        }
      };

      authService.validateToken(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.valid).toBe(false);
        expect(response.user).toBeNull();
        done();
      });
    });
  });

  describe('register', () => {
    it('新しいユーザーを登録できる', (done) => {
      (storage.getUserByUsername as jest.Mock).mockReturnValue(undefined);
      (storage.addUser as jest.Mock).mockImplementation(() => {});

      const call = {
        request: {
          username: 'newuser',
          password: 'password123',
          displayName: 'New User'
        }
      };

      authService.register(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(true);
        expect(response.user.username).toBe('newuser');
        expect(storage.addUser).toHaveBeenCalled();
        done();
      });
    });

    it('既存のユーザー名での登録を拒否する', (done) => {
      const mockUser = {
        id: 'user-1',
        username: 'existinguser',
        passwordHash: 'hash',
        displayName: 'Existing User',
        createdAt: Date.now(),
        isActive: true
      };

      (storage.getUserByUsername as jest.Mock).mockReturnValue(mockUser);

      const call = {
        request: {
          username: 'existinguser',
          password: 'password123',
          displayName: 'New User'
        }
      };

      authService.register(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(false);
        expect(response.errorMessage).toBe('このユーザー名は既に使用されています');
        done();
      });
    });
  });

  describe('validateToken helper function', () => {
    it('有効なトークンでユーザーを返す', () => {
      const mockSession = {
        token: 'valid-token',
        userId: 'user-1',
        createdAt: Date.now()
      };

      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        passwordHash: 'hash',
        displayName: 'Test User',
        createdAt: Date.now(),
        isActive: true
      };

      (storage.getSession as jest.Mock).mockReturnValue(mockSession);
      (storage.getUserById as jest.Mock).mockReturnValue(mockUser);

      const result = validateToken('valid-token');
      expect(result).toEqual(mockUser);
    });

    it('無効なトークンでnullを返す', () => {
      (storage.getSession as jest.Mock).mockReturnValue(undefined);

      const result = validateToken('invalid-token');
      expect(result).toBeNull();
    });
  });
});
