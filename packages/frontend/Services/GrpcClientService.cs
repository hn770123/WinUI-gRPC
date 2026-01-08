using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Grpc.Core;
using Grpc.Net.Client;
using Chat.Proto;
using ChatApp.Models;

namespace ChatApp.Services;

public class GrpcClientService : IDisposable
{
    private readonly GrpcChannel _channel;
    private readonly AuthService.AuthServiceClient _authClient;
    private readonly ChannelService.ChannelServiceClient _channelClient;
    private readonly MessageService.MessageServiceClient _messageClient;
    private readonly UserService.UserServiceClient _userClient;

    public string? CurrentToken { get; private set; }
    public User? CurrentUser { get; private set; }

    public GrpcClientService(string serverAddress)
    {
        _channel = GrpcChannel.ForAddress(serverAddress);
        _authClient = new AuthService.AuthServiceClient(_channel);
        _channelClient = new ChannelService.ChannelServiceClient(_channel);
        _messageClient = new MessageService.MessageServiceClient(_channel);
        _userClient = new UserService.UserServiceClient(_channel);
    }

    // 認証
    public async Task<(bool success, string error)> LoginAsync(string username, string password)
    {
        try
        {
            var response = await _authClient.LoginAsync(new LoginRequest
            {
                Username = username,
                Password = password
            });

            if (response.Success)
            {
                CurrentToken = response.Token;
                CurrentUser = new User
                {
                    Id = response.User.Id,
                    Username = response.User.Username,
                    DisplayName = response.User.DisplayName,
                    CreatedAt = response.User.CreatedAt,
                    IsActive = response.User.IsActive
                };
                return (true, string.Empty);
            }

            return (false, response.ErrorMessage);
        }
        catch (Exception ex)
        {
            return (false, $"接続エラー: {ex.Message}");
        }
    }

    public async Task<bool> LogoutAsync()
    {
        if (string.IsNullOrEmpty(CurrentToken))
            return true;

        try
        {
            await _authClient.LogoutAsync(new LogoutRequest { Token = CurrentToken });
            CurrentToken = null;
            CurrentUser = null;
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<(bool success, string error)> RegisterAsync(string username, string password, string displayName)
    {
        try
        {
            var response = await _authClient.RegisterAsync(new RegisterRequest
            {
                Username = username,
                Password = password,
                DisplayName = displayName
            });

            return (response.Success, response.ErrorMessage);
        }
        catch (Exception ex)
        {
            return (false, $"接続エラー: {ex.Message}");
        }
    }

    // チャンネル
    public async Task<List<Channel>> GetChannelsAsync()
    {
        if (string.IsNullOrEmpty(CurrentToken))
            return new List<Channel>();

        try
        {
            var response = await _channelClient.ListChannelsAsync(new ListChannelsRequest
            {
                Token = CurrentToken
            });

            return response.Channels.Select(c => new Channel
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                CreatedAt = c.CreatedAt,
                CreatedBy = c.CreatedBy,
                MemberIds = c.MemberIds.ToList(),
                IsPrivate = c.IsPrivate
            }).ToList();
        }
        catch
        {
            return new List<Channel>();
        }
    }

    public async Task<(bool success, Channel? channel, string error)> CreateChannelAsync(string name, string description, bool isPrivate)
    {
        if (string.IsNullOrEmpty(CurrentToken))
            return (false, null, "認証が必要です");

        try
        {
            var response = await _channelClient.CreateChannelAsync(new CreateChannelRequest
            {
                Name = name,
                Description = description,
                IsPrivate = isPrivate,
                Token = CurrentToken
            });

            if (response.Success)
            {
                var channel = new Channel
                {
                    Id = response.Channel.Id,
                    Name = response.Channel.Name,
                    Description = response.Channel.Description,
                    CreatedAt = response.Channel.CreatedAt,
                    CreatedBy = response.Channel.CreatedBy,
                    MemberIds = response.Channel.MemberIds.ToList(),
                    IsPrivate = response.Channel.IsPrivate
                };
                return (true, channel, string.Empty);
            }

            return (false, null, response.ErrorMessage);
        }
        catch (Exception ex)
        {
            return (false, null, $"接続エラー: {ex.Message}");
        }
    }

    public async Task<(bool success, string error)> UpdateChannelAsync(string channelId, string name, string description)
    {
        if (string.IsNullOrEmpty(CurrentToken))
            return (false, "認証が必要です");

        try
        {
            var response = await _channelClient.UpdateChannelAsync(new UpdateChannelRequest
            {
                ChannelId = channelId,
                Name = name,
                Description = description,
                Token = CurrentToken
            });

            return (response.Success, response.ErrorMessage);
        }
        catch (Exception ex)
        {
            return (false, $"接続エラー: {ex.Message}");
        }
    }

    public async Task<(bool success, string error)> DeleteChannelAsync(string channelId)
    {
        if (string.IsNullOrEmpty(CurrentToken))
            return (false, "認証が必要です");

        try
        {
            var response = await _channelClient.DeleteChannelAsync(new DeleteChannelRequest
            {
                ChannelId = channelId,
                Token = CurrentToken
            });

            return (response.Success, response.ErrorMessage);
        }
        catch (Exception ex)
        {
            return (false, $"接続エラー: {ex.Message}");
        }
    }

    // メッセージ
    public async Task<List<Message>> GetMessagesAsync(string channelId, int limit = 100)
    {
        if (string.IsNullOrEmpty(CurrentToken))
            return new List<Message>();

        try
        {
            var response = await _messageClient.ListMessagesAsync(new ListMessagesRequest
            {
                ChannelId = channelId,
                Limit = limit,
                Token = CurrentToken
            });

            return response.Messages.Select(m => new Message
            {
                Id = m.Id,
                ChannelId = m.ChannelId,
                UserId = m.UserId,
                Username = m.Username,
                Content = m.Content,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            }).ToList();
        }
        catch
        {
            return new List<Message>();
        }
    }

    public async Task<(bool success, string error)> SendMessageAsync(string channelId, string content)
    {
        if (string.IsNullOrEmpty(CurrentToken))
            return (false, "認証が必要です");

        try
        {
            var response = await _messageClient.SendMessageAsync(new SendMessageRequest
            {
                ChannelId = channelId,
                Content = content,
                Token = CurrentToken
            });

            return (response.Success, response.ErrorMessage);
        }
        catch (Exception ex)
        {
            return (false, $"接続エラー: {ex.Message}");
        }
    }

    public async Task SubscribeToMessagesAsync(string channelId, Action<Message> onMessageReceived, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(CurrentToken))
            return;

        try
        {
            using var call = _messageClient.SubscribeMessages(new SubscribeMessagesRequest
            {
                ChannelId = channelId,
                Token = CurrentToken
            }, cancellationToken: cancellationToken);

            await foreach (var messageEvent in call.ResponseStream.ReadAllAsync(cancellationToken))
            {
                if (messageEvent.EventType == MessageEvent.Types.EventType.MessageSent)
                {
                    var message = new Message
                    {
                        Id = messageEvent.Message.Id,
                        ChannelId = messageEvent.Message.ChannelId,
                        UserId = messageEvent.Message.UserId,
                        Username = messageEvent.Message.Username,
                        Content = messageEvent.Message.Content,
                        CreatedAt = messageEvent.Message.CreatedAt,
                        UpdatedAt = messageEvent.Message.UpdatedAt
                    };
                    onMessageReceived(message);
                }
            }
        }
        catch (OperationCanceledException)
        {
            // 正常なキャンセル
        }
        catch
        {
            // エラー処理
        }
    }

    // ユーザー
    public async Task<List<User>> GetUsersAsync()
    {
        if (string.IsNullOrEmpty(CurrentToken))
            return new List<User>();

        try
        {
            var response = await _userClient.ListUsersAsync(new ListUsersRequest
            {
                Token = CurrentToken
            });

            return response.Users.Select(u => new User
            {
                Id = u.Id,
                Username = u.Username,
                DisplayName = u.DisplayName,
                CreatedAt = u.CreatedAt,
                IsActive = u.IsActive
            }).ToList();
        }
        catch
        {
            return new List<User>();
        }
    }

    public void Dispose()
    {
        _channel?.Dispose();
    }
}
