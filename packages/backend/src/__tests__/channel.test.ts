import { channelService } from '../services/channel';
import { storage } from '../storage';
import * as auth from '../services/auth';

// storageとauthをモック
jest.mock('../storage', () => ({
  storage: {
    addChannel: jest.fn(),
    getChannelsByUserId: jest.fn(),
    getChannelById: jest.fn(),
    updateChannel: jest.fn(),
    deleteChannel: jest.fn(),
  }
}));

jest.mock('../services/auth', () => ({
  validateToken: jest.fn(),
}));

describe('ChannelService', () => {
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

  describe('createChannel', () => {
    it('新しいチャンネルを作成できる', (done) => {
      (auth.validateToken as jest.Mock).mockReturnValue(mockUser);
      (storage.addChannel as jest.Mock).mockImplementation(() => {});

      const call = {
        request: {
          name: 'Test Channel',
          description: 'Test Description',
          isPrivate: false,
          token: 'valid-token'
        }
      };

      channelService.createChannel(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(true);
        expect(response.channel.name).toBe('Test Channel');
        expect(response.channel.memberIds).toContain('user-1');
        expect(storage.addChannel).toHaveBeenCalled();
        done();
      });
    });

    it('認証エラーで失敗する', (done) => {
      (auth.validateToken as jest.Mock).mockReturnValue(null);

      const call = {
        request: {
          name: 'Test Channel',
          description: 'Test Description',
          isPrivate: false,
          token: 'invalid-token'
        }
      };

      channelService.createChannel(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(false);
        expect(response.errorMessage).toBe('認証エラー: 無効なトークン');
        done();
      });
    });
  });

  describe('listChannels', () => {
    it('ユーザーのチャンネルリストを取得できる', (done) => {
      const mockChannels = [
        {
          id: 'channel-1',
          name: 'Channel 1',
          description: 'Description 1',
          createdAt: Date.now(),
          createdBy: 'user-1',
          memberIds: ['user-1'],
          isPrivate: false
        }
      ];

      (auth.validateToken as jest.Mock).mockReturnValue(mockUser);
      (storage.getChannelsByUserId as jest.Mock).mockReturnValue(mockChannels);

      const call = {
        request: {
          token: 'valid-token'
        }
      };

      channelService.listChannels(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.channels).toHaveLength(1);
        expect(response.channels[0].id).toBe('channel-1');
        done();
      });
    });
  });

  describe('getChannel', () => {
    it('チャンネル情報を取得できる', (done) => {
      const mockChannel = {
        id: 'channel-1',
        name: 'Channel 1',
        description: 'Description 1',
        createdAt: Date.now(),
        createdBy: 'user-1',
        memberIds: ['user-1'],
        isPrivate: false
      };

      (auth.validateToken as jest.Mock).mockReturnValue(mockUser);
      (storage.getChannelById as jest.Mock).mockReturnValue(mockChannel);

      const call = {
        request: {
          channelId: 'channel-1',
          token: 'valid-token'
        }
      };

      channelService.getChannel(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(true);
        expect(response.channel.id).toBe('channel-1');
        done();
      });
    });

    it('メンバーでない場合はアクセスを拒否する', (done) => {
      const mockChannel = {
        id: 'channel-1',
        name: 'Channel 1',
        description: 'Description 1',
        createdAt: Date.now(),
        createdBy: 'user-2',
        memberIds: ['user-2'],
        isPrivate: false
      };

      (auth.validateToken as jest.Mock).mockReturnValue(mockUser);
      (storage.getChannelById as jest.Mock).mockReturnValue(mockChannel);

      const call = {
        request: {
          channelId: 'channel-1',
          token: 'valid-token'
        }
      };

      channelService.getChannel(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(false);
        expect(response.errorMessage).toBe('このチャンネルへのアクセス権がありません');
        done();
      });
    });
  });

  describe('updateChannel', () => {
    it('チャンネル作成者がチャンネルを更新できる', (done) => {
      const mockChannel = {
        id: 'channel-1',
        name: 'Channel 1',
        description: 'Description 1',
        createdAt: Date.now(),
        createdBy: 'user-1',
        memberIds: ['user-1'],
        isPrivate: false
      };

      (auth.validateToken as jest.Mock).mockReturnValue(mockUser);
      (storage.getChannelById as jest.Mock).mockReturnValue(mockChannel);
      (storage.updateChannel as jest.Mock).mockImplementation(() => {});

      const call = {
        request: {
          channelId: 'channel-1',
          name: 'Updated Channel',
          description: 'Updated Description',
          token: 'valid-token'
        }
      };

      channelService.updateChannel(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(true);
        expect(storage.updateChannel).toHaveBeenCalled();
        done();
      });
    });

    it('作成者でない場合は更新を拒否する', (done) => {
      const mockChannel = {
        id: 'channel-1',
        name: 'Channel 1',
        description: 'Description 1',
        createdAt: Date.now(),
        createdBy: 'user-2',
        memberIds: ['user-1', 'user-2'],
        isPrivate: false
      };

      (auth.validateToken as jest.Mock).mockReturnValue(mockUser);
      (storage.getChannelById as jest.Mock).mockReturnValue(mockChannel);

      const call = {
        request: {
          channelId: 'channel-1',
          name: 'Updated Channel',
          description: 'Updated Description',
          token: 'valid-token'
        }
      };

      channelService.updateChannel(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(false);
        expect(response.errorMessage).toBe('チャンネルの作成者のみが更新できます');
        done();
      });
    });
  });

  describe('deleteChannel', () => {
    it('チャンネル作成者がチャンネルを削除できる', (done) => {
      const mockChannel = {
        id: 'channel-1',
        name: 'Channel 1',
        description: 'Description 1',
        createdAt: Date.now(),
        createdBy: 'user-1',
        memberIds: ['user-1'],
        isPrivate: false
      };

      (auth.validateToken as jest.Mock).mockReturnValue(mockUser);
      (storage.getChannelById as jest.Mock).mockReturnValue(mockChannel);
      (storage.deleteChannel as jest.Mock).mockImplementation(() => {});

      const call = {
        request: {
          channelId: 'channel-1',
          token: 'valid-token'
        }
      };

      channelService.deleteChannel(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(true);
        expect(storage.deleteChannel).toHaveBeenCalledWith('channel-1');
        done();
      });
    });
  });

  describe('addChannelMember', () => {
    it('チャンネル作成者がメンバーを追加できる', (done) => {
      const mockChannel = {
        id: 'channel-1',
        name: 'Channel 1',
        description: 'Description 1',
        createdAt: Date.now(),
        createdBy: 'user-1',
        memberIds: ['user-1'],
        isPrivate: false
      };

      (auth.validateToken as jest.Mock).mockReturnValue(mockUser);
      (storage.getChannelById as jest.Mock).mockReturnValue(mockChannel);
      (storage.updateChannel as jest.Mock).mockImplementation(() => {});

      const call = {
        request: {
          channelId: 'channel-1',
          userId: 'user-2',
          token: 'valid-token'
        }
      };

      channelService.addChannelMember(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(true);
        expect(storage.updateChannel).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('removeChannelMember', () => {
    it('チャンネル作成者がメンバーを削除できる', (done) => {
      const mockChannel = {
        id: 'channel-1',
        name: 'Channel 1',
        description: 'Description 1',
        createdAt: Date.now(),
        createdBy: 'user-1',
        memberIds: ['user-1', 'user-2'],
        isPrivate: false
      };

      (auth.validateToken as jest.Mock).mockReturnValue(mockUser);
      (storage.getChannelById as jest.Mock).mockReturnValue(mockChannel);
      (storage.updateChannel as jest.Mock).mockImplementation(() => {});

      const call = {
        request: {
          channelId: 'channel-1',
          userId: 'user-2',
          token: 'valid-token'
        }
      };

      channelService.removeChannelMember(call, (error: any, response: any) => {
        expect(error).toBeNull();
        expect(response.success).toBe(true);
        expect(storage.updateChannel).toHaveBeenCalled();
        done();
      });
    });
  });
});
