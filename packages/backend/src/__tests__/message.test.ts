import { messageService } from '../services/message';
import { storage } from '../storage';
import * as auth from '../services/auth';

// storageとauthをモック
jest.mock('../storage', () => ({
  storage: {
    getChannelById: jest.fn(),
    addMessage: jest.fn(),
    getMessagesByChannelId: jest.fn(),
    getMessageById: jest.fn(),
    deleteMessage: jest.fn(),
  }
}));

jest.mock('../services/auth', () => ({
  validateToken: jest.fn(),
}));

describe('MessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    passwordHash: 'hash',
    displayName: 'Test User',
    createdAt: Date.now(),
    isActive: true
  };

  const mockChannel = {
    id: 'channel-1',
    name: 'Channel 1',
    description: 'Description 1',
    createdAt: Date.now(),
    createdBy: 'user-1',
    memberIds: ['user-1'],
    isPrivate: false
  };

  describe('sendMessage', () => {
    it('メッセージを送信できる', (done) => {
      (auth.validateToken as jest.Mock).mockReturnValue(mockUser);
      (storage.getChannelById as jest.Mock).mockReturnValue(mockChannel);
      (storage.addMessage as jest.Mock).mockImplementation(() => {});

      const call = {
        request: {
          channelId: 'channel-1',
          content: 'Hello, World!',
          token: 'valid-token'
        }
      };

      messageService.sendMessage(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(true);
        expect(response.message.content).toBe('Hello, World!');
        expect(response.message.username).toBe('Test User');
        expect(storage.addMessage).toHaveBeenCalled();
        done();
      });
    });

    it('認証エラーで失敗する', (done) => {
      (auth.validateToken as jest.Mock).mockReturnValue(null);

      const call = {
        request: {
          channelId: 'channel-1',
          content: 'Hello, World!',
          token: 'invalid-token'
        }
      };

      messageService.sendMessage(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(false);
        expect(response.errorMessage).toBe('認証エラー: 無効なトークン');
        done();
      });
    });

    it('存在しないチャンネルへの送信で失敗する', (done) => {
      (auth.validateToken as jest.Mock).mockReturnValue(mockUser);
      (storage.getChannelById as jest.Mock).mockReturnValue(undefined);

      const call = {
        request: {
          channelId: 'nonexistent-channel',
          content: 'Hello, World!',
          token: 'valid-token'
        }
      };

      messageService.sendMessage(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(false);
        expect(response.errorMessage).toBe('チャンネルが見つかりません');
        done();
      });
    });

    it('メンバーでない場合は送信を拒否する', (done) => {
      const channelWithoutUser = {
        ...mockChannel,
        memberIds: ['user-2']
      };

      (auth.validateToken as jest.Mock).mockReturnValue(mockUser);
      (storage.getChannelById as jest.Mock).mockReturnValue(channelWithoutUser);

      const call = {
        request: {
          channelId: 'channel-1',
          content: 'Hello, World!',
          token: 'valid-token'
        }
      };

      messageService.sendMessage(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(false);
        expect(response.errorMessage).toBe('このチャンネルへのアクセス権がありません');
        done();
      });
    });
  });

  describe('listMessages', () => {
    it('チャンネルのメッセージリストを取得できる', (done) => {
      const mockMessages = [
        {
          id: 'message-1',
          channelId: 'channel-1',
          userId: 'user-1',
          username: 'Test User',
          content: 'Hello!',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      (auth.validateToken as jest.Mock).mockReturnValue(mockUser);
      (storage.getChannelById as jest.Mock).mockReturnValue(mockChannel);
      (storage.getMessagesByChannelId as jest.Mock).mockReturnValue(mockMessages);

      const call = {
        request: {
          channelId: 'channel-1',
          limit: 100,
          before: undefined,
          token: 'valid-token'
        }
      };

      messageService.listMessages(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.messages).toHaveLength(1);
        expect(response.messages[0].content).toBe('Hello!');
        done();
      });
    });

    it('認証されていない場合は空のリストを返す', (done) => {
      (auth.validateToken as jest.Mock).mockReturnValue(null);

      const call = {
        request: {
          channelId: 'channel-1',
          limit: 100,
          before: undefined,
          token: 'invalid-token'
        }
      };

      messageService.listMessages(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.messages).toHaveLength(0);
        done();
      });
    });
  });

  describe('deleteMessage', () => {
    it('自分のメッセージを削除できる', (done) => {
      const mockMessage = {
        id: 'message-1',
        channelId: 'channel-1',
        userId: 'user-1',
        username: 'Test User',
        content: 'Hello!',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      (auth.validateToken as jest.Mock).mockReturnValue(mockUser);
      (storage.getMessageById as jest.Mock).mockReturnValue(mockMessage);
      (storage.deleteMessage as jest.Mock).mockImplementation(() => {});

      const call = {
        request: {
          messageId: 'message-1',
          token: 'valid-token'
        }
      };

      messageService.deleteMessage(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(true);
        expect(storage.deleteMessage).toHaveBeenCalledWith('message-1');
        done();
      });
    });

    it('他人のメッセージは削除できない', (done) => {
      const mockMessage = {
        id: 'message-1',
        channelId: 'channel-1',
        userId: 'user-2',
        username: 'Other User',
        content: 'Hello!',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      (auth.validateToken as jest.Mock).mockReturnValue(mockUser);
      (storage.getMessageById as jest.Mock).mockReturnValue(mockMessage);

      const call = {
        request: {
          messageId: 'message-1',
          token: 'valid-token'
        }
      };

      messageService.deleteMessage(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(false);
        expect(response.errorMessage).toBe('自分のメッセージのみ削除できます');
        done();
      });
    });

    it('存在しないメッセージの削除で失敗する', (done) => {
      (auth.validateToken as jest.Mock).mockReturnValue(mockUser);
      (storage.getMessageById as jest.Mock).mockReturnValue(undefined);

      const call = {
        request: {
          messageId: 'nonexistent-message',
          token: 'valid-token'
        }
      };

      messageService.deleteMessage(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(false);
        expect(response.errorMessage).toBe('メッセージが見つかりません');
        done();
      });
    });
  });
});
