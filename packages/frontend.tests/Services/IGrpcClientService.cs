using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ChatApp.Models;

namespace ChatApp.Services;

/// <summary>
/// GrpcClientServiceのインターフェース(テストのモック作成用)
/// </summary>
public interface IGrpcClientService : IDisposable
{
    string? CurrentToken { get; }
    User? CurrentUser { get; }

    Task<(bool success, string error)> LoginAsync(string username, string password);
    Task<bool> LogoutAsync();
    Task<(bool success, string error)> RegisterAsync(string username, string password, string displayName);
    Task<List<Channel>> GetChannelsAsync();
    Task<(bool success, Channel? channel, string error)> CreateChannelAsync(string name, string description, bool isPrivate);
    Task<(bool success, string error)> UpdateChannelAsync(string channelId, string name, string description);
    Task<(bool success, string error)> DeleteChannelAsync(string channelId);
    Task<List<Message>> GetMessagesAsync(string channelId, int limit = 100);
    Task<(bool success, string error)> SendMessageAsync(string channelId, string content);
    Task SubscribeToMessagesAsync(string channelId, Action<Message> onMessageReceived, CancellationToken cancellationToken);
    Task<List<User>> GetUsersAsync();
}
