using System;
using System.Threading.Tasks;
using ChatApp.Services;
using Xunit;

namespace ChatApp.Tests.Services;

/// <summary>
/// GrpcClientServiceの統合テスト
/// 注意: このテストは実際のgRPCサーバーが動作している必要があります
/// モックを使用したユニットテストはViewModelテストを参照してください
/// </summary>
public class GrpcClientServiceTests : IDisposable
{
    private readonly GrpcClientService _service;
    private const string TestServerAddress = "http://localhost:50051";

    public GrpcClientServiceTests()
    {
        _service = new GrpcClientService(TestServerAddress);
    }

    [Fact]
    public void Constructor_ShouldInitializeService()
    {
        // Arrange & Act
        using var service = new GrpcClientService(TestServerAddress);

        // Assert
        Assert.NotNull(service);
        Assert.Null(service.CurrentToken);
        Assert.Null(service.CurrentUser);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidCredentials_ShouldReturnFailure()
    {
        // Arrange
        var username = "nonexistentuser";
        var password = "wrongpassword";

        // Act
        var (success, error) = await _service.LoginAsync(username, password);

        // Assert
        Assert.False(success);
        Assert.NotEmpty(error);
        Assert.Null(_service.CurrentToken);
        Assert.Null(_service.CurrentUser);
    }

    [Fact]
    public async Task RegisterAsync_WithEmptyUsername_ShouldHandleGracefully()
    {
        // Arrange
        var username = string.Empty;
        var password = "password123";
        var displayName = "Test User";

        // Act
        var (success, error) = await _service.RegisterAsync(username, password, displayName);

        // Assert
        // サーバー側のバリデーションに依存するため、エラーが返されることを確認
        Assert.False(success);
    }

    [Fact]
    public async Task GetChannelsAsync_WithoutAuthentication_ShouldReturnEmptyList()
    {
        // Arrange & Act
        var channels = await _service.GetChannelsAsync();

        // Assert
        Assert.NotNull(channels);
        Assert.Empty(channels);
    }

    [Fact]
    public async Task GetMessagesAsync_WithoutAuthentication_ShouldReturnEmptyList()
    {
        // Arrange
        var channelId = "test-channel-id";

        // Act
        var messages = await _service.GetMessagesAsync(channelId);

        // Assert
        Assert.NotNull(messages);
        Assert.Empty(messages);
    }

    [Fact]
    public async Task GetUsersAsync_WithoutAuthentication_ShouldReturnEmptyList()
    {
        // Arrange & Act
        var users = await _service.GetUsersAsync();

        // Assert
        Assert.NotNull(users);
        Assert.Empty(users);
    }

    [Fact]
    public async Task SendMessageAsync_WithoutAuthentication_ShouldReturnFailure()
    {
        // Arrange
        var channelId = "test-channel-id";
        var content = "Test message";

        // Act
        var (success, error) = await _service.SendMessageAsync(channelId, content);

        // Assert
        Assert.False(success);
        Assert.Equal("認証が必要です", error);
    }

    [Fact]
    public async Task CreateChannelAsync_WithoutAuthentication_ShouldReturnFailure()
    {
        // Arrange
        var name = "Test Channel";
        var description = "Test Description";

        // Act
        var (success, channel, error) = await _service.CreateChannelAsync(name, description, false);

        // Assert
        Assert.False(success);
        Assert.Null(channel);
        Assert.Equal("認証が必要です", error);
    }

    [Fact]
    public async Task LogoutAsync_WithoutToken_ShouldReturnTrue()
    {
        // Arrange & Act
        var result = await _service.LogoutAsync();

        // Assert
        Assert.True(result);
        Assert.Null(_service.CurrentToken);
        Assert.Null(_service.CurrentUser);
    }

    public void Dispose()
    {
        _service?.Dispose();
    }
}
